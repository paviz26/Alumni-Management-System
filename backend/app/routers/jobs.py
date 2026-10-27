from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models import Alumni, JobApplication, JobPosting, Notification, Student, User
from app.schemas import JobCreate
from app.core.compat import CompatibleAPIRoute

router = APIRouter(prefix="/jobs", tags=["Jobs"], route_class=CompatibleAPIRoute)


def _current_student(db: Session, user: User) -> Student | None:
    return db.query(Student).filter(Student.user_id == user.user_id).first()


def _current_alumni(db: Session, user: User) -> Alumni | None:
    return db.query(Alumni).filter(Alumni.user_id == user.user_id).first()


@router.get("")
def list_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    jobs = db.query(JobPosting).order_by(JobPosting.created_at.desc()).all()
    result = []
    student = _current_student(db, current_user)
    for job in jobs:
        poster = db.query(Alumni).filter(Alumni.alumni_id == job.posted_by).first() if job.posted_by else None
        poster_user = db.query(User).filter(User.user_id == poster.user_id).first() if poster else None
        has_applied = bool(student and db.query(JobApplication).filter(JobApplication.job_id == job.job_id, JobApplication.student_id == student.student_id).first())
        result.append({
            "job_id": job.job_id,
            "title": job.job_title,
            "company_name": job.company,
            "location": job.location,
            "employment_type": job.job_type,
            "deadline": job.deadline.isoformat() if job.deadline else None,
            "description": job.description,
            "application_url": job.application_link,
            "poster_name": f"{poster_user.first_name or ''} {poster_user.last_name or ''}".strip() if poster_user else "Alumni",
            "has_applied": has_applied,
            "application_count": db.query(func.count(JobApplication.application_id)).filter(JobApplication.job_id == job.job_id).scalar() or 0,
        })
    return result


@router.get("/recent")
def recent_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    jobs = db.query(JobPosting).order_by(JobPosting.created_at.desc()).limit(5).all()
    return [{
        "job_id": job.job_id,
        "title": job.job_title,
        "company_name": job.company,
        "location": job.location,
        "deadline": job.deadline.isoformat() if job.deadline else None,
    } for job in jobs]


@router.get("/my-applications")
def my_applications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    student = _current_student(db, current_user)
    if not student:
        return []
    apps = db.query(JobApplication).filter(JobApplication.student_id == student.student_id).order_by(JobApplication.applied_on.desc()).all()
    result = []
    for app in apps:
        job = db.query(JobPosting).filter(JobPosting.job_id == app.job_id).first()
        result.append({
            "application_id": app.application_id,
            "job_id": job.job_id if job else app.job_id,
            "job_title": job.job_title if job else "Job",
            "company_name": job.company if job else None,
            "location": job.location if job else None,
            "applied_at": app.applied_on.isoformat() if app.applied_on else None,
            "status": app.status,
        })
    return result


@router.get("/my-postings")
def my_postings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alumni = _current_alumni(db, current_user)
    if not alumni:
        return []
    jobs = db.query(JobPosting).filter(JobPosting.posted_by == alumni.alumni_id).order_by(JobPosting.created_at.desc()).all()
    result = []
    for job in jobs:
        result.append({
            "job_id": job.job_id,
            "title": job.job_title,
            "company_name": job.company,
            "location": job.location,
            "employment_type": job.job_type,
            "deadline": job.deadline.isoformat() if job.deadline else None,
            "application_count": db.query(func.count(JobApplication.application_id)).filter(JobApplication.job_id == job.job_id).scalar() or 0,
        })
    return result


@router.post("", status_code=status.HTTP_201_CREATED)
def create_job(payload: JobCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in {"ALUMNI", "ADMIN"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only alumni can create job postings")
    alumni = _current_alumni(db, current_user)
    if not alumni and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alumni profile not found")
    if not payload.title.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required")
    if payload.deadline and payload.deadline < datetime.utcnow().date():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Deadline cannot be in the past")
    job = JobPosting(
        posted_by=alumni.alumni_id if alumni else None,
        company=payload.company.strip() if payload.company else None,
        job_title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        location=payload.location.strip() if payload.location else None,
        job_type=payload.employmentType.strip() if payload.employmentType else "FULL_TIME",
        deadline=payload.deadline,
        application_link=payload.applicationUrl.strip() if payload.applicationUrl else None,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return {"job_id": job.job_id, "title": job.job_title, "status": "created"}


@router.put("/{job_id}")
def update_job(job_id: int, payload: JobCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(JobPosting).filter(JobPosting.job_id == job_id).first()
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    alumni = _current_alumni(db, current_user)
    if current_user.role != "ADMIN" and (current_user.role != "ALUMNI" or not alumni or job.posted_by != alumni.alumni_id):
        raise HTTPException(status_code=403, detail="Only the posting alumni or an administrator may update this job")
    if payload.deadline and payload.deadline < datetime.utcnow().date():
        raise HTTPException(status_code=422, detail="Deadline cannot be in the past")
    job.job_title = payload.title.strip()
    job.description = payload.description.strip() if payload.description else None
    job.company = payload.company.strip() if payload.company else None
    job.location = payload.location.strip() if payload.location else None
    job.job_type = payload.employmentType.strip() if payload.employmentType else None
    job.deadline = payload.deadline
    job.application_link = payload.applicationUrl.strip() if payload.applicationUrl else None
    db.commit()
    return {"success": True, "job_id": job.job_id, "title": job.job_title}


@router.post("/{job_id}/apply", status_code=status.HTTP_201_CREATED)
def apply_for_job(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "STUDENT":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can apply for jobs")
    student = _current_student(db, current_user)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")
    job = db.query(JobPosting).filter(JobPosting.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    if job.deadline and job.deadline < datetime.utcnow().date():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This opportunity has expired")
    existing = db.query(JobApplication).filter(JobApplication.job_id == job_id, JobApplication.student_id == student.student_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You already applied for this job")
    application = JobApplication(job_id=job_id, student_id=student.student_id, status="PENDING")
    db.add(application)
    db.add(Notification(user_id=current_user.user_id, message=f"Application submitted for {job.job_title}.", type="JOB", is_read=False))
    try:
        db.commit()
        db.refresh(application)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You already applied for this job") from exc
    return {"application_id": application.application_id, "job_id": job_id, "status": application.status}


@router.delete("/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(JobPosting).filter(JobPosting.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    alumni = _current_alumni(db, current_user)
    if current_user.role != "ADMIN" and (not alumni or job.posted_by != alumni.alumni_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the poster can delete this posting")
    db.delete(job)
    db.commit()
    return {"success": True, "message": "Job posting deleted successfully"}

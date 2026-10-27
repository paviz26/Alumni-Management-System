from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models import Alumni, Department, Mentorship, Notification, Student, User
from app.schemas import MentorshipCreate, MentorshipStatusUpdate

router = APIRouter(prefix="/mentorship", tags=["Mentorship"])


def _current_student(db: Session, user: User) -> Student | None:
    return db.query(Student).filter(Student.user_id == user.user_id).first()


def _current_alumni(db: Session, user: User) -> Alumni | None:
    return db.query(Alumni).filter(Alumni.user_id == user.user_id).first()


@router.post("", status_code=status.HTTP_201_CREATED)
def create_mentorship(payload: MentorshipCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in {"STUDENT", "ALUMNI"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students may request mentorship")
    mentor = db.query(Alumni).filter(Alumni.alumni_id == payload.mentor_id).first()
    if not mentor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mentor not found")
    if current_user.user_id == mentor.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot request mentorship from yourself")

    student = _current_student(db, current_user)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")
    existing = db.query(Mentorship).filter(Mentorship.student_id == student.student_id, Mentorship.alumni_id == mentor.alumni_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Mentorship request already exists")

    mentorship = Mentorship(
        student_id=student.student_id,
        alumni_id=mentor.alumni_id,
        area_of_interest=payload.area_of_interest.strip(),
        message=payload.message.strip(),
        status="PENDING",
    )
    db.add(mentorship)
    db.commit()
    db.refresh(mentorship)

    mentor_user = db.query(User).filter(User.user_id == mentor.user_id).first()
    if mentor_user:
        db.add(Notification(user_id=mentor_user.user_id, message=f"{current_user.first_name or current_user.email} requested mentorship in {payload.area_of_interest}.", type="MENTORSHIP", is_read=False))
    db.commit()
    return {"mentorship_id": mentorship.mentorship_id, "status": mentorship.status, "mentor_id": mentor.alumni_id}


@router.get("/my-requests")
def my_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    student = _current_student(db, current_user)
    if not student:
        return []
    rows = db.query(Mentorship).filter(Mentorship.student_id == student.student_id).order_by(Mentorship.requested_on.desc()).all()
    result = []
    for item in rows:
        mentor = db.query(Alumni).filter(Alumni.alumni_id == item.alumni_id).first()
        mentor_user = db.query(User).filter(User.user_id == mentor.user_id).first() if mentor else None
        result.append({
            "mentorship_id": item.mentorship_id,
            "mentor_id": item.alumni_id,
            "mentor_name": f"{mentor_user.first_name or ''} {mentor_user.last_name or ''}".strip() if mentor_user else "Mentor",
            "area_of_interest": item.area_of_interest,
            "message": item.message,
            "status": item.status,
            "requested_at": item.requested_on.isoformat() if item.requested_on else None,
        })
    return result


@router.get("/requests")
def mentorship_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alumni = _current_alumni(db, current_user)
    if not alumni:
        return []
    rows = db.query(Mentorship).filter(Mentorship.alumni_id == alumni.alumni_id).order_by(Mentorship.requested_on.desc()).all()
    result = []
    for item in rows:
        student = db.query(Student).filter(Student.student_id == item.student_id).first()
        student_user = db.query(User).filter(User.user_id == student.user_id).first() if student else None
        result.append({
            "mentorship_id": item.mentorship_id,
            "mentee_name": f"{student_user.first_name or ''} {student_user.last_name or ''}".strip() if student_user else "Student",
            "area_of_interest": item.area_of_interest,
            "message": item.message,
            "status": item.status,
            "requested_at": item.requested_on.isoformat() if item.requested_on else None,
        })
    return result


@router.get("/active")
def active_mentorships(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    student = _current_student(db, current_user)
    alumni = _current_alumni(db, current_user)
    rows = db.query(Mentorship).filter(Mentorship.status.in_(["ACCEPTED", "PENDING"])).all()
    if student:
        rows = [r for r in rows if r.student_id == student.student_id]
    elif alumni:
        rows = [r for r in rows if r.alumni_id == alumni.alumni_id]
    else:
        rows = []
    result = []
    for item in rows:
        mentor = db.query(Alumni).filter(Alumni.alumni_id == item.alumni_id).first()
        mentor_user = db.query(User).filter(User.user_id == mentor.user_id).first() if mentor else None
        result.append({
            "mentorship_id": item.mentorship_id,
            "mentor_id": item.alumni_id,
            "mentor_name": f"{mentor_user.first_name or ''} {mentor_user.last_name or ''}".strip() if mentor_user else "Mentor",
            "area_of_interest": item.area_of_interest,
            "requested_at": item.requested_on.isoformat() if item.requested_on else None,
            "status": item.status,
        })
    return result


@router.get("/overview")
def mentorship_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Mentorship)
    if current_user.role == "ALUMNI":
        alumni = _current_alumni(db, current_user)
        if alumni:
            query = query.filter(Mentorship.alumni_id == alumni.alumni_id)
        else:
            return {"active": 0, "completed": 0, "pending": 0}
    elif current_user.role == "FACULTY":
        pass
    else:
        student = _current_student(db, current_user)
        if student:
            query = query.filter(Mentorship.student_id == student.student_id)
        else:
            return {"active": 0, "completed": 0, "pending": 0}
    rows = query.all()
    return {
        "active": sum(1 for item in rows if item.status == "ACCEPTED"),
        "completed": sum(1 for item in rows if item.status == "COMPLETED"),
        "pending": sum(1 for item in rows if item.status == "PENDING"),
    }


@router.put("/{mentorship_id}")
def update_mentorship(mentorship_id: int, payload: MentorshipStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mentorship = db.query(Mentorship).filter(Mentorship.mentorship_id == mentorship_id).first()
    if not mentorship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mentorship request not found")
    alumni = _current_alumni(db, current_user)
    if current_user.role != "ADMIN" and alumni and mentorship.alumni_id != alumni.alumni_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the assigned alumni can update this request")
    mentorship.status = payload.status
    student = db.query(Student).filter(Student.student_id == mentorship.student_id).first()
    if student and student.user_id != current_user.user_id:
        db.add(Notification(user_id=student.user_id, message=f"Your mentorship request was {payload.status.lower()}.", type="MENTORSHIP", is_read=False))
    db.commit()
    return {"success": True, "message": "Mentorship updated", "status": payload.status}


@router.delete("/{mentorship_id}")
def delete_mentorship(mentorship_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mentorship = db.query(Mentorship).filter(Mentorship.mentorship_id == mentorship_id).first()
    if not mentorship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mentorship request not found")
    student = _current_student(db, current_user)
    alumni = _current_alumni(db, current_user)
    if current_user.role != "ADMIN" and not (student and mentorship.student_id == student.student_id or alumni and mentorship.alumni_id == alumni.alumni_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to cancel this request")
    db.delete(mentorship)
    db.commit()
    return {"success": True, "message": "Mentorship request cancelled successfully"}

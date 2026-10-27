from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models import Achievement, Alumni, Company, Connection, Department, Student, User
from app.schemas import AchievementCreate

router = APIRouter(prefix="/alumni", tags=["Alumni"])


def serialize_alumni_row(db: Session, alumni: Alumni) -> dict:
    user = db.query(User).filter(User.user_id == alumni.user_id).first()
    department = db.query(Department).filter(Department.department_id == alumni.department_id).first() if alumni.department_id else None
    company_name = alumni.current_company or (db.query(Company).filter(Company.company_id == alumni.company_id).first().company_name if alumni.company_id else None)
    verified = bool(alumni.verified or alumni.verification_status == "VERIFIED")
    payload = {
        "alumni_id": alumni.alumni_id,
        "user_id": alumni.user_id,
        "first_name": alumni.first_name or (user.first_name if user else ""),
        "last_name": alumni.last_name or (user.last_name if user else ""),
        "email": user.email if user else None,
        "phone": alumni.phone,
        "department_code": department.department_code if department else None,
        "department_name": department.department_name if department else None,
        "graduation_year": alumni.graduation_year,
        "company_name": company_name,
        "designation": alumni.designation,
        "location": alumni.location,
        "bio": alumni.bio,
        "linkedin_url": alumni.linkedin_url,
        "github_url": alumni.github_url,
        "verified": verified,
        "verification_status": alumni.verification_status or ("VERIFIED" if verified else "PENDING"),
    }
    return payload


@router.get("")
def list_alumni(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    offset = (page - 1) * limit
    query = db.query(Alumni)
    total = query.count()
    items = query.order_by(Alumni.alumni_id.desc()).offset(offset).limit(limit).all()
    return {"alumni": [serialize_alumni_row(db, item) for item in items], "currentPage": page, "totalPages": max((total + limit - 1) // limit, 1), "totalItems": total}


@router.get("/search")
def search_alumni(
    keyword: str | None = None,
    department: str | None = None,
    graduationYear: int | None = None,
    field: str | None = None,
    company: str | None = None,
    location: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Alumni)
    if keyword:
        keyword_l = "%{}%".format(keyword.lower())
        query = query.join(User, User.user_id == Alumni.user_id).join(Department, Department.department_id == Alumni.department_id, isouter=True).filter(
            or_(
                User.first_name.ilike(f"%{keyword}%"),
                User.last_name.ilike(f"%{keyword}%"),
                Alumni.current_company.ilike(f"%{keyword}%"),
                Alumni.designation.ilike(f"%{keyword}%"),
                Department.department_name.ilike(f"%{keyword}%"),
            )
        )
    if department:
        dep = db.query(Department).filter(Department.department_code.ilike(department.strip()) | Department.department_name.ilike(department.strip())).first()
        if dep:
            query = query.filter(Alumni.department_id == dep.department_id)
    if graduationYear:
        query = query.filter(Alumni.graduation_year == graduationYear)
    if field:
        query = query.filter(Alumni.designation.ilike(f"%{field}%"))
    if company:
        query = query.filter(Alumni.current_company.ilike(f"%{company}%"))
    if location:
        query = query.filter(Alumni.location.ilike(f"%{location}%"))
    query = query.order_by(Alumni.alumni_id.desc())
    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    return {"alumni": [serialize_alumni_row(db, item) for item in items], "currentPage": page, "totalPages": max((total + limit - 1) // limit, 1), "totalItems": total}


@router.get("/suggested")
def suggested_alumni(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alumni = db.query(Alumni).filter(Alumni.user_id != current_user.user_id).order_by(Alumni.alumni_id.desc()).limit(10).all()
    return [serialize_alumni_row(db, item) for item in alumni]


@router.get("/available-mentors")
def available_mentors(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alumni = db.query(Alumni).filter(Alumni.user_id != current_user.user_id).order_by(Alumni.alumni_id.desc()).all()
    return [serialize_alumni_row(db, item) for item in alumni]


@router.get("/stats")
def alumni_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alumni = db.query(Alumni).filter(Alumni.user_id == current_user.user_id).first()
    if not alumni:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alumni profile not found")
    connections_count = db.query(Connection).filter((Connection.sender_id == current_user.user_id) | (Connection.receiver_id == current_user.user_id)).count()
    return {"connections": connections_count, "mentorshipRequests": 0, "alumniId": alumni.alumni_id}


@router.get("/achievements")
def get_achievements(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alumni = db.query(Alumni).filter(Alumni.user_id == current_user.user_id).first()
    if not alumni:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alumni profile not found")
    achievements = db.query(Achievement).filter(Achievement.alumni_id == alumni.alumni_id).order_by(Achievement.achievement_id.desc()).all()
    return [{
        "achievement_id": item.achievement_id,
        "title": item.title,
        "description": item.description,
        "achievement_date": item.achievement_date.isoformat() if item.achievement_date else None,
    } for item in achievements]


@router.post("/achievements", status_code=status.HTTP_201_CREATED)
def create_achievement(payload: AchievementCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in {"ALUMNI", "ADMIN"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only alumni can create achievements")
    alumni = db.query(Alumni).filter(Alumni.user_id == current_user.user_id).first()
    if not alumni and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alumni profile not found")
    target_alumni_id = alumni.alumni_id if alumni else None
    if current_user.role == "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin cannot create achievements without alumni context")
    achievement = Achievement(
        alumni_id=target_alumni_id,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        achievement_date=payload.achievementDate,
    )
    db.add(achievement)
    db.commit()
    db.refresh(achievement)
    return {"achievement_id": achievement.achievement_id, "title": achievement.title, "description": achievement.description, "achievement_date": achievement.achievement_date.isoformat() if achievement.achievement_date else None}


@router.put("/achievements/{achievement_id}")
def update_achievement(achievement_id: int, payload: AchievementCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    achievement = db.query(Achievement).filter(Achievement.achievement_id == achievement_id).first()
    if not achievement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Achievement not found")
    alumni = db.query(Alumni).filter(Alumni.user_id == current_user.user_id).first()
    if current_user.role != "ADMIN" and not alumni or (alumni and achievement.alumni_id != alumni.alumni_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this achievement")
    achievement.title = payload.title.strip()
    achievement.description = payload.description.strip() if payload.description else None
    achievement.achievement_date = payload.achievementDate
    db.commit()
    return {"success": True, "message": "Achievement updated successfully"}


@router.delete("/achievements/{achievement_id}")
def delete_achievement(achievement_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    achievement = db.query(Achievement).filter(Achievement.achievement_id == achievement_id).first()
    if not achievement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Achievement not found")
    alumni = db.query(Alumni).filter(Alumni.user_id == current_user.user_id).first()
    if current_user.role != "ADMIN" and (not alumni or achievement.alumni_id != alumni.alumni_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this achievement")
    db.delete(achievement)
    db.commit()
    return {"success": True, "message": "Achievement deleted successfully"}


@router.get("/me")
def get_my_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alumni = db.query(Alumni).filter(Alumni.user_id == current_user.user_id).first()
    if not alumni:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    payload = serialize_alumni_row(db, alumni)
    payload["achievements"] = [{
        "achievement_id": a.achievement_id,
        "title": a.title,
        "description": a.description,
        "achievement_date": a.achievement_date.isoformat() if a.achievement_date else None,
    } for a in db.query(Achievement).filter(Achievement.alumni_id == alumni.alumni_id).all()]
    return payload


@router.put("/me")
def update_my_profile(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alumni = db.query(Alumni).filter(Alumni.user_id == current_user.user_id).first()
    if not alumni:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    if payload.get("firstName") is not None:
        alumni.first_name = payload["firstName"]; current_user.first_name = payload["firstName"]
    if payload.get("lastName") is not None:
        alumni.last_name = payload["lastName"]; current_user.last_name = payload["lastName"]
    if payload.get("phone") is not None: alumni.phone = payload["phone"]
    if payload.get("company") is not None: alumni.current_company = payload["company"]
    if payload.get("jobTitle") is not None: alumni.designation = payload["jobTitle"]
    if payload.get("location") is not None: alumni.location = payload["location"]
    if payload.get("bio") is not None: alumni.bio = payload["bio"]
    if payload.get("linkedinUrl") is not None: alumni.linkedin_url = payload["linkedinUrl"]
    if payload.get("githubUrl") is not None: alumni.github_url = payload["githubUrl"]
    db.commit()
    return {"success": True, "message": "Profile updated successfully", "alumni": serialize_alumni_row(db, alumni)}


@router.get("/{alumni_id}")
def get_alumni_profile(alumni_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alumni = db.query(Alumni).filter(Alumni.alumni_id == alumni_id).first()
    if not alumni:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alumni not found")
    payload = serialize_alumni_row(db, alumni)
    payload["achievements"] = [{
        "achievement_id": a.achievement_id,
        "title": a.title,
        "description": a.description,
        "achievement_date": a.achievement_date.isoformat() if a.achievement_date else None,
    } for a in db.query(Achievement).filter(Achievement.alumni_id == alumni.alumni_id).all()]
    return payload

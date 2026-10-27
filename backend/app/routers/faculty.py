from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models import Alumni, Department, Faculty, Student, User

router = APIRouter(prefix="/faculty", tags=["Faculty"])


def _faculty_profile(db: Session, user: User) -> Faculty | None:
    return db.query(Faculty).filter(Faculty.user_id == user.user_id).first()


@router.get("/department-stats")
def department_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    faculty = _faculty_profile(db, current_user)
    if not faculty:
        return {"students": 0, "alumni": 0}
    dept_id = faculty.department_id
    return {"students": db.query(Student).filter(Student.department_id == dept_id).count() if dept_id else 0, "alumni": db.query(Alumni).filter(Alumni.department_id == dept_id).count() if dept_id else 0}


@router.get("/stats")
def faculty_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    faculty = _faculty_profile(db, current_user)
    if not faculty:
        return {"students": 0, "alumni": 0}
    return department_stats(db, current_user)


@router.get("/students")
def faculty_students(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    faculty = _faculty_profile(db, current_user)
    if not faculty or not faculty.department_id:
        return []
    rows = db.query(Student).filter(Student.department_id == faculty.department_id).all()
    result = []
    for row in rows:
        user = db.query(User).filter(User.user_id == row.user_id).first()
        dept = db.query(Department).filter(Department.department_id == row.department_id).first() if row.department_id else None
        result.append({
            "student_id": row.student_id,
            "first_name": user.first_name if user else None,
            "last_name": user.last_name if user else None,
            "registration_number": row.registration_number,
            "department_code": dept.department_code if dept else None,
        })
    return result


@router.get("/alumni")
def faculty_alumni(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    faculty = _faculty_profile(db, current_user)
    if not faculty or not faculty.department_id:
        return []
    rows = db.query(Alumni).filter(Alumni.department_id == faculty.department_id).all()
    result = []
    for row in rows:
        user = db.query(User).filter(User.user_id == row.user_id).first()
        dept = db.query(Department).filter(Department.department_id == row.department_id).first() if row.department_id else None
        result.append({
            "alumni_id": row.alumni_id,
            "first_name": row.first_name or (user.first_name if user else None),
            "last_name": row.last_name or (user.last_name if user else None),
            "designation": row.designation,
            "company_name": row.current_company,
            "graduation_year": row.graduation_year,
            "department_code": dept.department_code if dept else None,
        })
    return result

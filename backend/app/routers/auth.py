from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.database import get_db
from app.db.models import Alumni, Department, Faculty, Student, User
from app.schemas import AuthResponse, UserCreate, UserLogin

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _department_lookup(db: Session, department_name: str | None) -> int | None:
    if not department_name:
        return None
    name = department_name.strip()
    if not name:
        return None
    department = db.query(Department).filter(Department.department_name.ilike(name)).first()
    if department is None:
        department = Department(
            department_name=name,
            department_code=name[:20].upper().replace(" ", "-") or "GEN",
        )
        db.add(department)
        db.commit()
        db.refresh(department)
    return department.department_id


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=AuthResponse)
def register_user(payload: UserCreate, db: Session = Depends(get_db)) -> AuthResponse:
    email = payload.email.lower().strip()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={"success": False, "message": "Email already exists"})

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        role=payload.role.upper(),
        first_name=payload.firstName.strip(),
        last_name=payload.lastName.strip(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    department_id = _department_lookup(db, payload.department)

    if payload.role.upper() == "STUDENT":
        if not payload.registrationNumber:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"success": False, "message": "Registration number is required for students"})
        db.add(Student(user_id=user.user_id, department_id=department_id, registration_number=payload.registrationNumber.strip()))
    elif payload.role.upper() == "ALUMNI":
        if not payload.graduationYear:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"success": False, "message": "Graduation year is required for alumni"})
        if not payload.company:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"success": False, "message": "Company is required for alumni"})
        if not payload.jobTitle:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"success": False, "message": "Job title is required for alumni"})

        alumni = Alumni(
            user_id=user.user_id,
            department_id=department_id,
            first_name=user.first_name,
            last_name=user.last_name,
            graduation_year=payload.graduationYear,
            current_company=payload.company.strip(),
            designation=payload.jobTitle.strip(),
            location=payload.location.strip() if payload.location else None,
            verification_status="PENDING",
            verified=False,
        )
        db.add(alumni)
    elif payload.role.upper() == "FACULTY":
        if not payload.designation:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"success": False, "message": "Designation is required for faculty"})
        db.add(Faculty(user_id=user.user_id, department_id=department_id, designation=payload.designation.strip()))
    elif payload.role.upper() == "ADMIN":
        pass
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"success": False, "message": "Invalid role"})

    db.commit()

    user_payload = {
        "userId": user.user_id,
        "email": user.email,
        "role": user.role,
        "firstName": user.first_name or "",
        "lastName": user.last_name or "",
        "verified": False,
    }
    return AuthResponse(success=True, message="Account created successfully", user=user_payload)


@router.post("/login", response_model=AuthResponse)
def login_user(payload: UserLogin, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"success": False, "message": "Invalid credentials"})

    token = create_access_token(user.user_id)
    alumni_record = db.query(Alumni).filter(Alumni.user_id == user.user_id).first()
    verified = bool(alumni_record and alumni_record.verified)

    user_payload = {
        "userId": user.user_id,
        "email": user.email,
        "role": user.role,
        "firstName": user.first_name or "",
        "lastName": user.last_name or "",
        "verified": verified,
    }
    return AuthResponse(success=True, message="Login successful", token=token, user=user_payload)

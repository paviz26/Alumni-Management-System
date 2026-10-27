from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.compat import CompatibleAPIRoute
from app.core.dependencies import require_admin
from app.db.database import get_db
from app.db.models import User

router = APIRouter(prefix="/reports", tags=["Reports"], route_class=CompatibleAPIRoute)


def _view_rows(db: Session, view_name: str, limit: int, offset: int):
    # Names are constants selected only by these route functions; user input is never interpolated.
    return [dict(row) for row in db.execute(text(f"SELECT * FROM {view_name} LIMIT :limit OFFSET :offset"), {"limit": limit, "offset": offset}).mappings()]


@router.get("/alumni-directory")
def alumni_directory(limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return _view_rows(db, "alumni_directory", limit, offset)


@router.get("/event-participation")
def event_participation(limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return _view_rows(db, "event_participation", limit, offset)


@router.get("/alumni-career")
def alumni_career(limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return _view_rows(db, "alumni_career", limit, offset)


@router.get("/job-opportunities")
def job_opportunities(limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return _view_rows(db, "job_opportunities", limit, offset)


@router.get("/mentorship-directory")
def mentorship_directory(limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return _view_rows(db, "mentorship_directory", limit, offset)


@router.get("/donation-summary")
def donation_summary(limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return _view_rows(db, "donation_summary", limit, offset)


@router.get("/alumni-event-history")
def alumni_event_history(limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return _view_rows(db, "alumni_event_history", limit, offset)


@router.get("/department-alumni-summary")
def department_alumni_summary(limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return _view_rows(db, "department_alumni_summary", limit, offset)


@router.get("/functions/alumni-count")
def alumni_count_by_department(department_id: int = Query(..., gt=0), db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return {"department_id": department_id, "count": db.execute(text("SELECT get_alumni_count_by_department(:id)"), {"id": department_id}).scalar_one()}


@router.get("/functions/completed-donations-total")
def completed_donations_total(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return {"total": db.execute(text("SELECT get_total_completed_donations()")).scalar_one()}


@router.get("/functions/event-registration-count")
def event_registration_count(event_id: int = Query(..., gt=0), db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return {"event_id": event_id, "count": db.execute(text("SELECT get_event_registration_count(:id)"), {"id": event_id}).scalar_one()}


@router.get("/functions/alumni-donation-total")
def alumni_donation_total(alumni_id: int = Query(..., gt=0), db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return {"alumni_id": alumni_id, "total": db.execute(text("SELECT get_alumni_donation_total(:id)"), {"id": alumni_id}).scalar_one()}


@router.get("/functions/alumni-name")
def alumni_name(alumni_id: int = Query(..., gt=0), db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return {"alumni_id": alumni_id, "name": db.execute(text("SELECT get_alumni_name(:id)"), {"id": alumni_id}).scalar_one_or_none()}


@router.get("/functions/jobs-posted-count")
def jobs_posted_count(alumni_id: int = Query(..., gt=0), db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return {"alumni_id": alumni_id, "count": db.execute(text("SELECT get_jobs_posted_by_alumni(:id)"), {"id": alumni_id}).scalar_one()}

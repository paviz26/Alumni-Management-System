from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin, require_roles
from app.db.database import get_db
from app.db.models import Alumni, Donation, User
from app.schemas import DonationCreate, DonationStatusUpdate
from app.core.compat import CompatibleAPIRoute

router = APIRouter(prefix="/donations", tags=["Donations"], route_class=CompatibleAPIRoute)


def _serialize(donation: Donation) -> dict:
    return {
        "donation_id": donation.donation_id,
        "alumni_id": donation.alumni_id,
        "amount": str(donation.amount),
        "purpose": donation.purpose,
        "donation_date": donation.donation_date.isoformat() if donation.donation_date else None,
        "payment_status": donation.payment_status,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def record_donation(
    payload: DonationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ALUMNI")),
):
    alumni = db.query(Alumni).filter(Alumni.user_id == current_user.user_id).first()
    if alumni is None:
        raise HTTPException(status_code=404, detail="Alumni profile not found")
    donation = Donation(alumni_id=alumni.alumni_id, amount=payload.amount, purpose=payload.purpose.strip() if payload.purpose else None, payment_status="PENDING")
    db.add(donation)
    db.commit()
    db.refresh(donation)
    return {"success": True, "donation": _serialize(donation)}


@router.get("/me")
def my_donations(db: Session = Depends(get_db), current_user: User = Depends(require_roles("ALUMNI"))):
    alumni = db.query(Alumni).filter(Alumni.user_id == current_user.user_id).first()
    if alumni is None:
        return []
    return [_serialize(row) for row in db.query(Donation).filter(Donation.alumni_id == alumni.alumni_id).order_by(Donation.donation_date.desc()).all()]


@router.get("")
def list_donations(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    rows = db.query(Donation).order_by(Donation.donation_date.desc()).all()
    return [_serialize(row) for row in rows]


@router.get("/summary")
def donation_summary(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    total = db.query(func.coalesce(func.sum(Donation.amount), 0)).filter(Donation.payment_status == "COMPLETED").scalar()
    count = db.query(Donation).filter(Donation.payment_status == "COMPLETED").count()
    return {"completed_total": str(Decimal(total)), "completed_count": count}


@router.put("/{donation_id}/status")
def update_donation_status(
    donation_id: int,
    payload: DonationStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    donation = db.query(Donation).filter(Donation.donation_id == donation_id).first()
    if donation is None:
        raise HTTPException(status_code=404, detail="Donation not found")
    if donation.payment_status != "PENDING":
        raise HTTPException(status_code=409, detail="Only pending donation records can be finalized")
    donation.payment_status = payload.payment_status
    db.commit()
    return {"success": True, "donation": _serialize(donation)}

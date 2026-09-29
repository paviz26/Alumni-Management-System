from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models import Alumni, Event, EventInvite, EventRegistration, Notification, User
from app.schemas import EventCreate

router = APIRouter(prefix="/events", tags=["Events"])


def _current_alumni_for_user(db: Session, user: User) -> Alumni | None:
    return db.query(Alumni).filter(Alumni.user_id == user.user_id).first()


@router.get("")
def list_events(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(Event).order_by(Event.event_date.asc()).all()
    result = []
    for event in rows:
        registration_count = db.query(func.count(EventRegistration.registration_id)).filter(EventRegistration.event_id == event.event_id).scalar() or 0
        is_registered = False
        alumni = _current_alumni_for_user(db, current_user)
        if alumni:
            is_registered = db.query(EventRegistration).filter(EventRegistration.event_id == event.event_id, EventRegistration.alumni_id == alumni.alumni_id).first() is not None
        result.append({
            "event_id": event.event_id,
            "title": event.title,
            "description": event.description,
            "event_date": event.event_date.isoformat() if event.event_date else None,
            "venue": event.venue,
            "capacity": event.capacity,
            "type": event.type,
            "status": event.status,
            "registration_count": registration_count,
            "is_registered": is_registered,
        })
    return result


@router.get("/upcoming")
def upcoming_events(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(Event).filter(Event.event_date >= datetime.utcnow()).order_by(Event.event_date.asc()).all()
    result = []
    alumni = _current_alumni_for_user(db, current_user)
    for event in rows:
        registration_count = db.query(func.count(EventRegistration.registration_id)).filter(EventRegistration.event_id == event.event_id).scalar() or 0
        is_registered = bool(alumni and db.query(EventRegistration).filter(EventRegistration.event_id == event.event_id, EventRegistration.alumni_id == alumni.alumni_id).first())
        result.append({
            "event_id": event.event_id,
            "title": event.title,
            "description": event.description,
            "event_date": event.event_date.isoformat() if event.event_date else None,
            "venue": event.venue,
            "capacity": event.capacity,
            "type": event.type,
            "registration_count": registration_count,
            "is_registered": is_registered,
        })
    return result


@router.get("/past")
def past_events(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(Event).filter(Event.event_date < datetime.utcnow()).order_by(Event.event_date.desc()).all()
    return [{
        "event_id": event.event_id,
        "title": event.title,
        "description": event.description,
        "event_date": event.event_date.isoformat() if event.event_date else None,
        "venue": event.venue,
        "capacity": event.capacity,
        "attendance_count": db.query(func.count(EventRegistration.registration_id)).filter(EventRegistration.event_id == event.event_id).scalar() or 0,
    } for event in rows]


@router.get("/recent")
def recent_events(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(Event).order_by(Event.event_date.desc()).limit(5).all()
    return [{
        "event_id": event.event_id,
        "title": event.title,
        "description": event.description,
        "event_date": event.event_date.isoformat() if event.event_date else None,
        "venue": event.venue,
        "capacity": event.capacity,
        "type": event.type,
        "status": event.status,
    } for event in rows]


@router.get("/my-registrations")
def my_registrations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alumni = _current_alumni_for_user(db, current_user)
    if not alumni:
        return []
    rows = db.query(EventRegistration).filter(EventRegistration.alumni_id == alumni.alumni_id).order_by(EventRegistration.registered_at.desc()).all()
    return [{
        "registration_id": reg.registration_id,
        "event_id": reg.event_id,
        "event_title": db.query(Event).filter(Event.event_id == reg.event_id).first().title if db.query(Event).filter(Event.event_id == reg.event_id).first() else "Event",
        "event_date": (db.query(Event).filter(Event.event_id == reg.event_id).first().event_date.isoformat() if db.query(Event).filter(Event.event_id == reg.event_id).first() else None),
        "venue": (db.query(Event).filter(Event.event_id == reg.event_id).first().venue if db.query(Event).filter(Event.event_id == reg.event_id).first() else None),
        "attendance_status": reg.attendance_status,
        "registered_at": reg.registered_at.isoformat() if reg.registered_at else None,
    } for reg in rows]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_event(payload: EventCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in {"FACULTY", "ADMIN"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only faculty and admins can create events")
    if not payload.title.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required")
    event_date = payload.eventDate
    if isinstance(event_date, str):
        event_date = datetime.fromisoformat(event_date.replace("Z", "+00:00"))
    if event_date < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Event date must be in the future")

    event = Event(
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        event_date=event_date,
        venue=payload.venue.strip() if payload.venue else None,
        capacity=payload.capacity,
        type=payload.type.strip() if payload.type else "GENERAL",
        status="PENDING",
        created_by=current_user.user_id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return {"event_id": event.event_id, "title": event.title, "status": event.status}


@router.post("/{event_id}/register", status_code=status.HTTP_201_CREATED)
def register_for_event(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = db.query(Event).filter(Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    alumni = _current_alumni_for_user(db, current_user)
    if not alumni:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only alumni can register for events")
    existing = db.query(EventRegistration).filter(EventRegistration.event_id == event_id, EventRegistration.alumni_id == alumni.alumni_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already registered for this event")
    registration = EventRegistration(event_id=event_id, alumni_id=alumni.alumni_id, attendance_status="REGISTERED")
    db.add(registration)
    db.commit()
    db.refresh(registration)
    db.add(Notification(user_id=current_user.user_id, message=f"You registered for {event.title}.", type="EVENT", is_read=False))
    db.commit()
    return {"registration_id": registration.registration_id, "event_id": event_id, "status": registration.attendance_status}


@router.post("/{event_id}/invite")
def invite_to_event(event_id: int, payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = db.query(Event).filter(Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if current_user.role not in {"FACULTY", "ADMIN"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only faculty/admin can invite users")
    invited_user_id = payload.get("userId") or payload.get("user_id")
    if not invited_user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="userId is required")
    existing = db.query(EventInvite).filter(EventInvite.event_id == event_id, EventInvite.user_id == invited_user_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already invited")
    invite = EventInvite(event_id=event_id, user_id=invited_user_id, invited_by=current_user.user_id, status="PENDING")
    db.add(invite)
    db.commit()
    return {"success": True, "message": "Invitation sent", "invite_id": invite.invite_id}


@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = db.query(Event).filter(Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if current_user.role != "ADMIN" and event.created_by != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own event")
    db.delete(event)
    db.commit()
    return {"success": True, "message": "Event deleted successfully"}


@router.delete("/registrations/{registration_id}")
def delete_registration(registration_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    registration = db.query(EventRegistration).filter(EventRegistration.registration_id == registration_id).first()
    if not registration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")
    alumni = _current_alumni_for_user(db, current_user)
    if current_user.role != "ADMIN" and (not alumni or registration.alumni_id != alumni.alumni_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the registrant can cancel")
    db.delete(registration)
    db.commit()
    return {"success": True, "message": "Registration cancelled successfully"}

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError, DBAPIError
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models import Alumni, Event, EventInvite, EventRegistration, Notification, User
from app.schemas import EventCreate, EventInviteCreate, EventUpdate
from app.core.compat import CompatibleAPIRoute

router = APIRouter(prefix="/events", tags=["Events"], route_class=CompatibleAPIRoute)


def _current_alumni_for_user(db: Session, user: User) -> Alumni | None:
    return db.query(Alumni).filter(Alumni.user_id == user.user_id).first()


def _visible_events(query, user: User):
    if user.role == "ADMIN":
        return query
    if user.role == "FACULTY":
        return query.filter(or_(Event.status == "APPROVED", Event.created_by == user.user_id))
    return query.filter(Event.status == "APPROVED")


@router.get("")
def list_events(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = _visible_events(db.query(Event), current_user).order_by(Event.event_date.asc()).all()
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
            "is_creator": event.created_by == current_user.user_id,
            "registration_count": registration_count,
            "is_registered": is_registered,
        })
    return result


@router.get("/upcoming")
def upcoming_events(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = _visible_events(db.query(Event), current_user).filter(Event.event_date >= datetime.utcnow()).order_by(Event.event_date.asc()).all()
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
    rows = _visible_events(db.query(Event), current_user).filter(Event.event_date < datetime.utcnow()).order_by(Event.event_date.desc()).all()
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
    rows = _visible_events(db.query(Event), current_user).order_by(Event.event_date.desc()).limit(5).all()
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
    if event_date.tzinfo is not None:
        event_date = event_date.astimezone(timezone.utc).replace(tzinfo=None)
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


@router.put("/{event_id}")
def update_event(event_id: int, payload: EventUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = db.query(Event).filter(Event.event_id == event_id).with_for_update().first()
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    if current_user.role != "ADMIN" and (current_user.role != "FACULTY" or event.created_by != current_user.user_id):
        raise HTTPException(status_code=403, detail="Only the event creator or an administrator may update this event")
    values = payload.model_dump(exclude_unset=True)
    event_date = values.get("eventDate")
    if isinstance(event_date, str):
        event_date = datetime.fromisoformat(event_date.replace("Z", "+00:00"))
    if event_date is not None:
        if event_date.tzinfo is not None:
            event_date = event_date.astimezone(timezone.utc).replace(tzinfo=None)
        if event_date < datetime.utcnow():
            raise HTTPException(status_code=422, detail="Event date must be in the future")
        event.event_date = event_date
    if "capacity" in values:
        count = db.query(func.count(EventRegistration.registration_id)).filter(EventRegistration.event_id == event_id).scalar() or 0
        if values["capacity"] is not None and values["capacity"] < count:
            raise HTTPException(status_code=409, detail="Capacity cannot be lower than the current registration count")
        event.capacity = values["capacity"]
    if "title" in values:
        event.title = values["title"].strip()
    if "description" in values:
        event.description = values["description"].strip() if values["description"] else None
    if "venue" in values:
        event.venue = values["venue"].strip() if values["venue"] else None
    if "type" in values:
        event.type = values["type"].strip() if values["type"] else "GENERAL"
    db.commit()
    return {"success": True, "event_id": event.event_id, "title": event.title, "status": event.status}


@router.post("/{event_id}/register", status_code=status.HTTP_201_CREATED)
def register_for_event(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = db.query(Event).filter(Event.event_id == event_id).with_for_update().first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if event.status != "APPROVED":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Event is not approved for registration")
    alumni = _current_alumni_for_user(db, current_user)
    if not alumni:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only alumni can register for events")
    existing = db.query(EventRegistration).filter(EventRegistration.event_id == event_id, EventRegistration.alumni_id == alumni.alumni_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already registered for this event")
    count = db.query(func.count(EventRegistration.registration_id)).filter(EventRegistration.event_id == event_id).scalar() or 0
    if event.capacity is not None and count >= event.capacity:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Event is full")
    registration = EventRegistration(event_id=event_id, alumni_id=alumni.alumni_id, attendance_status="REGISTERED")
    db.add(registration)
    db.add(Notification(user_id=current_user.user_id, message=f"You registered for {event.title}.", type="EVENT", is_read=False))
    try:
        db.commit()
        db.refresh(registration)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already registered for this event") from exc
    except DBAPIError as exc:
        db.rollback()
        if "already full" in str(exc).lower() or "capacity" in str(exc).lower():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Event is full") from exc
        raise
    return {"registration_id": registration.registration_id, "event_id": event_id, "status": registration.attendance_status}


@router.post("/{event_id}/invite")
def invite_to_event(event_id: int, payload: EventInviteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = db.query(Event).filter(Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if current_user.role not in {"FACULTY", "ADMIN"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only faculty/admin can invite users")
    invited_user_id = payload.userId
    if not db.query(User).filter(User.user_id == invited_user_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invited user not found")
    existing = db.query(EventInvite).filter(EventInvite.event_id == event_id, EventInvite.user_id == invited_user_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already invited")
    invite = EventInvite(event_id=event_id, user_id=invited_user_id, invited_by=current_user.user_id, status="PENDING")
    db.add(invite)
    db.add(Notification(user_id=invited_user_id, message=f"You were invited to {event.title}.", type="EVENT", is_read=False))
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

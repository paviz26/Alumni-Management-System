from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models import Alumni, Connection, Department, Notification, User
from app.schemas import ConnectionRequest, ConnectionStatusUpdate
from app.core.compat import CompatibleAPIRoute

router = APIRouter(prefix="/connections", tags=["Connections"], route_class=CompatibleAPIRoute)


@router.post("/request", status_code=status.HTTP_201_CREATED)
def request_connection(payload: ConnectionRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.alumni_id == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid alumni_id")
    target_alumni = db.query(Alumni).filter(Alumni.alumni_id == payload.alumni_id).first()
    if not target_alumni:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alumni not found")
    if target_alumni.user_id == current_user.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot connect with yourself")

    existing = db.query(Connection).filter(
        or_(
            (Connection.sender_id == current_user.user_id) & (Connection.receiver_id == target_alumni.user_id),
            (Connection.receiver_id == current_user.user_id) & (Connection.sender_id == target_alumni.user_id),
        )
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Connection request already exists")

    connection = Connection(sender_id=current_user.user_id, receiver_id=target_alumni.user_id, status="PENDING")
    db.add(connection)
    target_user = db.query(User).filter(User.user_id == target_alumni.user_id).first()
    if target_user:
        db.add(Notification(user_id=target_user.user_id, message=f"{current_user.first_name or current_user.email} sent you a connection request.", type="CONNECTION", is_read=False))
    try:
        db.commit()
        db.refresh(connection)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Connection request already exists") from exc
    return {"success": True, "message": "Connection request sent successfully", "connection_id": connection.connection_id}


@router.get("")
def list_connections(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    requests = db.query(Connection).filter((Connection.sender_id == current_user.user_id) | (Connection.receiver_id == current_user.user_id)).order_by(Connection.requested_on.desc()).all()
    return [{
        "connection_id": item.connection_id,
        "sender_id": item.sender_id,
        "receiver_id": item.receiver_id,
        "status": item.status,
        "requested_on": item.requested_on.isoformat() if item.requested_on else None,
        "accepted_on": item.accepted_on.isoformat() if item.accepted_on else None,
    } for item in requests]


@router.get("/requests")
def incoming_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = db.query(Connection).filter(Connection.receiver_id == current_user.user_id, Connection.status == "PENDING").order_by(Connection.requested_on.desc()).all()
    result = []
    for item in records:
        sender = db.query(User).filter(User.user_id == item.sender_id).first()
        alumni = db.query(Alumni).filter(Alumni.user_id == item.sender_id).first()
        department = db.query(Department).filter(Department.department_id == alumni.department_id).first() if alumni and alumni.department_id else None
        result.append({
            "connection_id": item.connection_id,
            "status": item.status,
            "requester_name": f"{sender.first_name or ''} {sender.last_name or ''}".strip() or sender.email,
            "requester_title": alumni.designation if alumni else "User",
            "requester_department": department.department_code if department else "Department",
            "requester_year": alumni.graduation_year if alumni else None,
            "created_at": item.requested_on.isoformat() if item.requested_on else None,
        })
    return result


@router.get("/my-connections")
def my_connections(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(Connection).filter(Connection.status == "ACCEPTED").filter((Connection.sender_id == current_user.user_id) | (Connection.receiver_id == current_user.user_id)).order_by(Connection.accepted_on.desc()).all()
    result = []
    for item in rows:
        peer_user_id = item.receiver_id if item.sender_id == current_user.user_id else item.sender_id
        peer = db.query(User).filter(User.user_id == peer_user_id).first()
        alumni = db.query(Alumni).filter(Alumni.user_id == peer_user_id).first()
        dept = db.query(Department).filter(Department.department_id == alumni.department_id).first() if alumni and alumni.department_id else None
        result.append({
            "connection_id": item.connection_id,
            "alumni_id": alumni.alumni_id if alumni else peer_user_id,
            "name": f"{peer.first_name or ''} {peer.last_name or ''}".strip() or peer.email,
            "title": alumni.designation if alumni else "User",
            "department": dept.department_code if dept else "Department",
            "graduation_year": alumni.graduation_year if alumni else None,
            "connected_at": item.accepted_on.isoformat() if item.accepted_on else item.requested_on.isoformat(),
        })
    return result


@router.get("/sent-requests")
def sent_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(Connection).filter(Connection.sender_id == current_user.user_id, Connection.status == "PENDING").order_by(Connection.requested_on.desc()).all()
    result = []
    for item in rows:
        recipient = db.query(User).filter(User.user_id == item.receiver_id).first()
        alumni = db.query(Alumni).filter(Alumni.user_id == item.receiver_id).first()
        result.append({
            "connection_id": item.connection_id,
            "recipient_name": f"{recipient.first_name or ''} {recipient.last_name or ''}".strip() or recipient.email,
            "recipient_title": alumni.designation if alumni else "User",
            "status": item.status,
            "created_at": item.requested_on.isoformat() if item.requested_on else None,
        })
    return result


@router.put("/{connection_id}")
def update_connection(connection_id: int, payload: ConnectionStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    connection = db.query(Connection).filter(Connection.connection_id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found")
    if connection.receiver_id != current_user.user_id and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the receiver can update this connection")
    if connection.status != "PENDING":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only pending connection requests can be answered")
    connection.status = payload.status
    if payload.status == "ACCEPTED":
        connection.accepted_on = datetime.utcnow()
    else:
        connection.accepted_on = None
    sender = db.query(User).filter(User.user_id == connection.sender_id).first()
    message = f"Your connection request was {payload.status.lower()}"
    db.add(Notification(user_id=connection.sender_id, message=message, type="CONNECTION", is_read=False))
    db.commit()
    return {"success": True, "message": f"Connection request {payload.status.lower()}!", "status": payload.status}


@router.delete("/{connection_id}")
def delete_connection(connection_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    connection = db.query(Connection).filter(Connection.connection_id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found")
    if connection.sender_id != current_user.user_id and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can cancel connection request")
    db.delete(connection)
    db.commit()
    return {"success": True, "message": "Connection request cancelled successfully"}

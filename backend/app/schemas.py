from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    firstName: str = Field(..., min_length=1)
    lastName: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Literal["STUDENT", "ALUMNI", "FACULTY", "ADMIN"]
    department: str | None = None
    registrationNumber: str | None = None
    graduationYear: int | None = None
    company: str | None = None
    jobTitle: str | None = None
    location: str | None = None
    designation: str | None = None

    @field_validator("password")
    @classmethod
    def validate_bcrypt_password_length(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be no more than 72 UTF-8 bytes")
        return value

    @field_validator("role")
    @classmethod
    def normalize_role(cls, value: str) -> str:
        return value.upper()


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

    @field_validator("password")
    @classmethod
    def validate_bcrypt_password_length(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be no more than 72 UTF-8 bytes")
        return value


class AuthResponse(BaseModel):
    success: bool = True
    message: str = "Success"
    user: dict | None = None
    token: str | None = None


class ConnectionRequest(BaseModel):
    alumni_id: int


class ConnectionStatusUpdate(BaseModel):
    status: Literal["ACCEPTED", "REJECTED"]


class MentorshipCreate(BaseModel):
    mentor_id: int
    area_of_interest: str = Field(..., min_length=1, max_length=100)
    message: str = Field(..., min_length=1)


class MentorshipStatusUpdate(BaseModel):
    status: Literal["ACCEPTED", "REJECTED", "COMPLETED"]


class EventCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str | None = None
    eventDate: datetime | str
    venue: str | None = None
    capacity: int | None = Field(default=None, gt=0)
    type: str | None = None

    @field_validator("eventDate")
    @classmethod
    def parse_event_date(cls, value):
        if isinstance(value, str):
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        return value


class AchievementCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str | None = None
    achievementDate: date | str | None = None

    @field_validator("achievementDate")
    @classmethod
    def parse_achievement_date(cls, value):
        if isinstance(value, str) and value:
            return date.fromisoformat(value)
        return value


class JobCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str | None = None
    company: str | None = None
    location: str | None = None
    employmentType: str | None = None
    deadline: date | str | None = None
    applicationUrl: str | None = None

    @field_validator("deadline")
    @classmethod
    def parse_deadline(cls, value):
        if isinstance(value, str) and value:
            return date.fromisoformat(value)
        return value


class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)


class ReasonPayload(BaseModel):
    reason: str | None = None


class NotificationMarkRead(BaseModel):
    read: bool = True

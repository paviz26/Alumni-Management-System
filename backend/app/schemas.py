from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class UserCreate(BaseModel):
    firstName: str = Field(..., min_length=1)
    lastName: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Literal["STUDENT", "ALUMNI", "FACULTY"]
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

    @model_validator(mode="after")
    def validate_role_fields(self):
        if self.role == "STUDENT" and not (self.registrationNumber and self.registrationNumber.strip()):
            raise ValueError("registrationNumber is required for student accounts")
        if self.role == "ALUMNI":
            if self.graduationYear is None or not 1950 <= self.graduationYear <= datetime.now(UTC).year + 10:
                raise ValueError("graduationYear must be between 1950 and the current year plus 10")
            if not (self.company and self.company.strip()):
                raise ValueError("company is required for alumni accounts")
            if not (self.jobTitle and self.jobTitle.strip()):
                raise ValueError("jobTitle is required for alumni accounts")
        if self.role == "FACULTY" and not (self.designation and self.designation.strip()):
            raise ValueError("designation is required for faculty accounts")
        return self


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


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    eventDate: datetime | str | None = None
    venue: str | None = None
    capacity: int | None = Field(default=None, gt=0)
    type: str | None = None

    @field_validator("eventDate")
    @classmethod
    def parse_optional_event_date(cls, value):
        if isinstance(value, str) and value:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        return value


class EventInviteCreate(BaseModel):
    userId: int = Field(..., gt=0)


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


class ProfileUpdate(BaseModel):
    firstName: str | None = Field(default=None, min_length=1, max_length=100)
    lastName: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    company: str | None = Field(default=None, max_length=150)
    jobTitle: str | None = Field(default=None, max_length=150)
    location: str | None = Field(default=None, max_length=150)
    bio: str | None = None
    linkedinUrl: str | None = None
    githubUrl: str | None = None


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

    @field_validator("applicationUrl")
    @classmethod
    def validate_application_url(cls, value):
        if value:
            from urllib.parse import urlparse
            parsed = urlparse(value)
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                raise ValueError("applicationUrl must be an absolute http or https URL")
        return value


class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)


class ReasonPayload(BaseModel):
    reason: str | None = None


class NotificationMarkRead(BaseModel):
    read: bool = True


class DonationCreate(BaseModel):
    amount: Decimal = Field(..., gt=0, max_digits=12, decimal_places=2)
    purpose: str | None = Field(default=None, max_length=200)


class DonationStatusUpdate(BaseModel):
    payment_status: Literal["COMPLETED", "FAILED"]

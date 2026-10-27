"""Create the first or an additional administrator from a trusted terminal."""
from getpass import getpass

from sqlalchemy.exc import IntegrityError

from app.core.security import hash_password
from app.db.database import SessionLocal
from app.db.models import User


def main() -> None:
    email = input("Administrator email: ").strip().lower()
    password = getpass("Password (at least 10 characters): ")
    confirmation = getpass("Confirm password: ")
    if len(password) < 10 or len(password.encode("utf-8")) > 72:
        raise SystemExit("Password must be at least 10 characters and at most 72 UTF-8 bytes")
    if password != confirmation:
        raise SystemExit("Passwords do not match")

    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == email).first():
            raise SystemExit("That email already has an account; no changes were made")
        admin = User(email=email, password_hash=hash_password(password), role="ADMIN")
        db.add(admin)
        db.commit()
        print(f"Administrator account created (user ID {admin.user_id}).")
    except IntegrityError as exc:
        db.rollback()
        raise SystemExit("Could not create administrator; verify the email and database constraints") from exc
    finally:
        db.close()


if __name__ == "__main__":
    main()

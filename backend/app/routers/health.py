from fastapi import APIRouter
from app.core.compat import CompatibleAPIRoute

router = APIRouter(tags=["Health"], route_class=CompatibleAPIRoute)


@router.get("/health")
def health_check() -> dict:
    return {"status": "ok", "message": "Alumni Management API is running"}

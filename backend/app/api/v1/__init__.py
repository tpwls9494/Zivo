from fastapi import APIRouter

from app.api.v1 import alerts, auth, bookings, flights, profile

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(flights.router, prefix="/flights", tags=["flights"])
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])

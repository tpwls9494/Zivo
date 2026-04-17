from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_alerts() -> dict:
    return {"items": []}


@router.post("")
async def create_alert() -> dict:
    return {}

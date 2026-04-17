from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def get_profile() -> dict:
    """Day 2 에서 구현."""
    return {}


@router.put("")
async def upsert_profile() -> dict:
    return {}

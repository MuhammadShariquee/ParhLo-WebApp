"""Auth endpoints — Supabase handles actual auth, this syncs user data."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.auth import get_current_user
from app.db.supabase_client import db
from loguru import logger

router = APIRouter()


class UserSyncRequest(BaseModel):
    name: str
    email: str


@router.post("/sync")
async def sync_user(
    body: UserSyncRequest,
    current_user: dict = Depends(get_current_user)
):
    """Sync user data after Supabase auth. Call after login."""
    try:
        user = await db.get_or_create_user_profile(
            user_id=current_user["id"],
            email=body.email or current_user["email"],
            name=body.name or current_user.get("name", "Student"),
        )
        return {"success": True, "user": user}
    except Exception as e:
        logger.error(f"User sync error: {e}")
        raise HTTPException(status_code=500, detail="Failed to sync user")


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile."""
    try:
        user = await db.get_or_create_user_profile(
            user_id=current_user["id"],
            email=current_user["email"],
            name=current_user.get("name", "Student"),
        )
        return user
    except Exception as e:
        logger.error(f"Get me error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user")


class PreferencesRequest(BaseModel):
    language: str = None
    theme: str = None


@router.put("/preferences")
async def update_preferences(
    body: PreferencesRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update user preferences."""
    try:
        await db.update_user_preferences(
            user_id=current_user["id"],
            language=body.language,
            theme=body.theme
        )
        return {"success": True}
    except Exception as e:
        logger.error(f"Update preferences error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update preferences")

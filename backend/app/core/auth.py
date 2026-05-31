"""
Auth dependencies — verify Supabase JWT tokens.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client
from app.core.config import settings
from loguru import logger
from typing import Dict

security = HTTPBearer()


def get_supabase_client():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict:
    """Verify JWT and return user data."""
    try:
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        user_response = client.auth.get_user(jwt=credentials.credentials)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        user = user_response.user
        return {
            "id": user.id,
            "email": user.email,
            "name": user.user_metadata.get("full_name", user.email.split("@")[0]),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

"""
Auth dependencies — verify Supabase JWT tokens.
"""
import httpx
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client
from app.core.config import settings
from loguru import logger
from typing import Dict

security = HTTPBearer(auto_error=False)


def get_supabase_client():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict:
    """Verify JWT and return user data."""
    token = request.query_params.get("token")
    if not token and credentials:
        token = credentials.credentials
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authenticated"
        )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.SUPABASE_URL}/auth/v1/user",
                headers={
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {token}"
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Supabase auth validation failed: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired token"
                )
            
            user = response.json()
            # Extract name correctly based on available user metadata
            user_metadata = user.get("user_metadata", {})
            full_name = user_metadata.get("full_name", user.get("email", "").split("@")[0])
            
            return {
                "id": user.get("id"),
                "email": user.get("email"),
                "name": full_name,
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

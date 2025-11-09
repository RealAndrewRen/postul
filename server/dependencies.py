from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Annotated, Optional
import logging

from services.supabase_service import supabase_service

logger = logging.getLogger(__name__)

# Security scheme for JWT token (optional)
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[str]:
    """
    FastAPI dependency to verify Supabase JWT token and return user ID.
    Returns None if no token is provided (anonymous user).
    
    Args:
        credentials: Optional HTTPBearer credentials containing the JWT token
        
    Returns:
        User ID (UUID string) from the verified token, or None if anonymous
        
    Raises:
        HTTPException: If token is provided but invalid
    """
    if not credentials:
        # No token provided - anonymous user
        return None
    
    token = credentials.credentials
    
    try:
        user_id = supabase_service.get_user_id(token)
        return user_id
    except ValueError as e:
        logger.warning(f"Invalid token format: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_user_id_or_anonymous(user_id: Optional[str]) -> str:
    """
    Get user ID or generate an anonymous user ID.
    For anonymous users, we use a session-based identifier.
    In a real app, you might want to use session cookies or similar.
    
    Args:
        user_id: Optional authenticated user ID
        
    Returns:
        User ID string (authenticated or anonymous)
    """
    if user_id:
        return user_id
    # Generate a consistent anonymous user ID for the session
    # In production, you might want to use session-based IDs
    return "anonymous"


# Type alias for dependency injection
OptionalCurrentUser = Annotated[Optional[str], Depends(get_current_user)]


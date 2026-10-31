from fastapi import APIRouter, Depends
from backend.app.core.security import get_current_user, AuthenticatedUser

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/me")
async def get_current_user_profile(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    return {
        "id": current_user.user_id,
        "name": current_user.name,
        "email": current_user.email,
        "plan": current_user.plan
    }

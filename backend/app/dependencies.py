"""
Centralized dependencies for multi-tenant data isolation.

This module provides reusable FastAPI dependencies that enforce
strict student-level data isolation across all API endpoints.
"""

from typing import Dict, Any, Optional
from fastapi import Depends, HTTPException, status, Request
from app.models.student import Student
from app.routers.auth import get_current_user


def get_student_filter(current_user: Student = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Dependency that returns a filter dictionary for the current student.
    
    This ensures ALL database and vector store queries are scoped to the
    logged-in student's university and roll number.
    
    Usage:
        @app.get("/some-endpoint")
        def endpoint(student_filter: Dict = Depends(get_student_filter)):
            results = store.similarity_search(..., filters=student_filter)
    
    Returns:
        Dict with keys: university, roll_no
    """
    return {
        "university": current_user.university,
        "roll_no": current_user.roll_no,
    }


async def ensure_admin(request: Request, current_user: Student = Depends(get_current_user)) -> Student:
    """
    Dependency that ensures the current user has admin privileges.
    
    CRITICAL: Allows OPTIONS requests (CORS preflight) to pass through without authentication.
    This prevents CORS errors when the browser sends preflight requests.
    
    Admin users are identified by having roll_no = "ADMIN" in the database.
    Regular students cannot access admin-only endpoints.
    
    Raises:
        HTTPException: 403 if user is not an admin
    
    Returns:
        The current user (validated as admin)
    """
    # Allow OPTIONS requests to pass through for CORS preflight
    if request.method == "OPTIONS":
        # Return a dummy admin object for OPTIONS - it won't be used
        return Student(
            university="SYSTEM",
            roll_no="OPTIONS",
            full_name="CORS Preflight",
            is_admin=True
        )
    
    # Check if user is admin (you can customize this logic)
    # For now, we check if roll_no contains "ADMIN" or if there's an is_admin field
    if not (current_user.roll_no == "ADMIN" or 
            getattr(current_user, "is_admin", False)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required. Students cannot access this endpoint.",
        )
    return current_user


def get_optional_student_filter(
    current_user: Optional[Student] = Depends(get_current_user)
) -> Optional[Dict[str, Any]]:
    """
    Optional student filter for endpoints that may work without authentication.
    
    Returns:
        Filter dict if user is authenticated, None otherwise
    """
    if current_user:
        return {
            "university": current_user.university,
            "roll_no": current_user.roll_no,
        }
    return None

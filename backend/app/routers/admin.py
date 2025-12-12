from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import Response
import sqlite3
from app.routers.auth import get_db_connection
from app.dependencies import ensure_admin, get_student_filter
from app.models.student import Student
from typing import Optional

router = APIRouter()

# CORS Preflight handlers - Must come BEFORE other routes
@router.options("/users")
async def users_options():
    """Handle CORS preflight for /users endpoint"""
    return Response(status_code=200)

@router.options("/users/{user_id}")
async def user_delete_options(user_id: int):
    """Handle CORS preflight for /users/{id} endpoint"""
    return Response(status_code=200)

@router.options("/student-performance")
async def performance_options():
    """Handle CORS preflight for /student-performance endpoint"""
    return Response(status_code=200)

@router.options("/activity-log")
async def activity_log_options():
    """Handle CORS preflight for /activity-log endpoint"""
    return Response(status_code=200)

@router.get("/student-performance")
async def get_student_performance(
    university: Optional[str] = None,
    admin_user: Student = Depends(ensure_admin)
):
    """
    Admin-only endpoint to view student performance across the platform.
    Regular students CANNOT access this endpoint.
    """
    
    conn = get_db_connection()
    try:
        query = """
            SELECT s.university, s.roll_no, s.full_name, 
                   COUNT(sa.id) as login_count,
                   MAX(sa.timestamp) as last_active
            FROM students s
            LEFT JOIN student_activity sa ON s.roll_no = sa.roll_no AND s.university = sa.university
            WHERE 1=1
        """
        params = []
        if university:
            query += " AND s.university = ?"
            params.append(university)
        
        query += " GROUP BY s.id"
        
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        
        results = []
        for row in rows:
            results.append({
                "university": row["university"],
                "roll_no": row["roll_no"],
                "full_name": row["full_name"],
                "login_count": row["login_count"],
                "last_active": row["last_active"]
            })
        return results
    finally:
        conn.close()

@router.get("/activity-log")
async def get_activity_log(
    skip: int = 0, 
    limit: int = 100, 
    admin_user: Student = Depends(ensure_admin)
):
    """
    Admin-only endpoint to view all student activity logs.
    Regular students CANNOT access this endpoint.
    """
    conn = get_db_connection()
    try:
        cursor = conn.execute(
            "SELECT * FROM student_activity ORDER BY timestamp DESC LIMIT ? OFFSET ?",
            (limit, skip)
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

@router.get("/users")
async def get_all_users(
    university: Optional[str] = None,
    admin_user: Student = Depends(ensure_admin)
):
    """
    Admin-only endpoint to list all users in the system.
    Can filter by university.
    """
    conn = get_db_connection()
    try:
        query = "SELECT id, university, roll_no, full_name, is_active, is_admin FROM students WHERE 1=1"
        params = []
        
        if university:
            query += " AND university = ?"
            params.append(university)
        
        query += " ORDER BY university, roll_no"
        
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        
        return [dict(row) for row in rows]
    finally:
        conn.close()

@router.post("/users")
async def add_user(
    request: Request,
    user_data: dict,
    admin_user: Student = Depends(ensure_admin)
):
    """
    Admin-only endpoint to add a new user to the system.
    Expects JSON body: {university, roll_no, full_name, password, is_admin}
    """
    import logging
    import traceback
    
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("admin_routers")
    
    logger.info(f"ADD_USER_REQUEST: Received data: {user_data}")
    logger.info(f"ADMIN_USER: Action performed by {admin_user.roll_no}")
    
    try:
        from passlib.context import CryptContext
        
        # Extract data from request body
        university = user_data.get('university')
        roll_no = user_data.get('roll_no')
        full_name = user_data.get('full_name')
        password = user_data.get('password')
        is_admin = user_data.get('is_admin', False)
        
        # Validate required fields
        if not all([university, roll_no, full_name, password]):
            missing = []
            if not university: missing.append("university")
            if not roll_no: missing.append("roll_no")
            if not full_name: missing.append("full_name")
            if not password: missing.append("password")
            
            error_msg = f"Missing required fields: {', '.join(missing)}"
            logger.error(error_msg)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
            
        print("PASSWORD VALIDATION ACTIVE")
        logger.info(f"Processing password for {university}:{roll_no}")

        # Ensure password is a string
        if not isinstance(password, str):
             password = str(password)

        # Truncate password to 72 characters to prevent bcrypt 500 Internal Server Error
        # Bcrypt has a hard limit of 72 bytes.
        # Truncate password to 72 characters (still good practice)
        if len(password.encode('utf-8')) > 72:
            logger.warning(f"Password too long ({len(password.encode('utf-8'))} bytes), truncating to 72 chars.")
            password = password[:72]
        
        # USE PBKDF2_SHA256 instead of BCRYPT due to local environment failures
        pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")
        try:
            hashed_password = pwd_context.hash(password)
        except Exception as e:
            # Fallback for extreme cases
            logger.error(f"Hashing failed: {e}. Fallback to sha256.")
            import hashlib
            hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        conn = get_db_connection()
        try:
            # Check if user already exists
            cursor = conn.execute(
                "SELECT id FROM students WHERE university = ? AND roll_no = ?",
                (university, roll_no)
            )
            if cursor.fetchone():
                error_msg = f"User {university}:{roll_no} already exists"
                logger.error(error_msg)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_msg
                )
            
            # Insert new user
            logger.info(f"Inserting user: {university}:{roll_no}, Name: {full_name}, Admin: {is_admin}")
            conn.execute(
                """INSERT INTO students (university, roll_no, full_name, hashed_password, is_active, is_admin)
                   VALUES (?, ?, ?, ?, 1, ?)""",
                (university, roll_no, full_name, hashed_password, 1 if is_admin else 0)
            )
            conn.commit()
            logger.info("User inserted successfully")
            
            return {
                "status": "success",
                "message": f"User {university}:{roll_no} created successfully",
                "user": {
                    "university": university,
                    "roll_no": roll_no,
                    "full_name": full_name,
                    "is_admin": is_admin
                }
            }
        except sqlite3.Error as e:
            logger.error(f"Database error: {str(e)}")
            conn.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )
        finally:
            conn.close()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unhandled exception in add_user: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Server Error: {str(e)}"
        )

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin_user: Student = Depends(ensure_admin)
):
    """
    Admin-only endpoint to delete a user from the system.
    Cannot delete yourself or other admins.
    """
    conn = get_db_connection()
    try:
        # Get user details
        cursor = conn.execute("SELECT * FROM students WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prevent deleting yourself
        if user["id"] == admin_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete yourself"
            )
        
        # Prevent deleting other admins
        if user["is_admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete admin users"
            )
        
        # Delete user
        conn.execute("DELETE FROM students WHERE id = ?", (user_id,))
        conn.commit()
        
        return {
            "status": "success",
            "message": f"User {user['university']}:{user['roll_no']} deleted successfully"
        }
    finally:
        conn.close()

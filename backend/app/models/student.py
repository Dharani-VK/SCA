from pydantic import BaseModel
from typing import Optional

class StudentBase(BaseModel):
    university: str
    roll_no: str
    full_name: Optional[str] = None

class StudentCreate(StudentBase):
    password: str

class StudentLogin(BaseModel):
    university: str
    roll_no: str
    password: str

class Student(StudentBase):
    id: int
    is_active: bool = True
    is_admin: bool = False  # Admin role flag for authorization

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: Student

class TokenData(BaseModel):
    roll_no: Optional[str] = None
    university: Optional[str] = None

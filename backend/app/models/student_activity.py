from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ActivityBase(BaseModel):
    activity_type: str # e.g., 'login', 'upload', 'quiz', 'summary'
    details: Optional[str] = None

class ActivityCreate(ActivityBase):
    pass

class Activity(ActivityBase):
    id: int
    student_roll_no: str
    university: str
    timestamp: datetime

    class Config:
        from_attributes = True

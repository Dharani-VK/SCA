"""
Data organization utilities for multi-tenant file storage.

This module provides utilities for organizing uploaded files and data
in a structured, per-student directory hierarchy.
"""

import os
import re
from pathlib import Path
from typing import Optional
from datetime import datetime


def get_student_data_path(university: str, roll_no: str, base_dir: str = "data") -> Path:
    """
    Get the data directory path for a specific student.
    
    Creates directory structure: /data/{university}/{roll_no}/
    
    Args:
        university: University code (e.g., "SCA", "MIT")
        roll_no: Student roll number
        base_dir: Base directory for all student data
    
    Returns:
        Path object for the student's data directory
    """
    # Sanitize inputs to prevent directory traversal
    safe_university = re.sub(r'[^a-zA-Z0-9_-]', '_', university)
    safe_roll_no = re.sub(r'[^a-zA-Z0-9_-]', '_', roll_no)
    
    student_path = Path(base_dir) / safe_university / safe_roll_no
    student_path.mkdir(parents=True, exist_ok=True)
    
    return student_path


def save_student_file(
    university: str,
    roll_no: str,
    filename: str,
    content: bytes,
    base_dir: str = "data"
) -> Path:
    """
    Save a file to the student's data directory.
    
    Files are organized as: /data/{university}/{roll_no}/{filename}
    
    Args:
        university: University code
        roll_no: Student roll number
        filename: Original filename
        content: File content as bytes
        base_dir: Base directory for all student data
    
    Returns:
        Path to the saved file
    """
    student_path = get_student_data_path(university, roll_no, base_dir)
    
    # Sanitize filename
    safe_filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    
    # Add timestamp to prevent overwrites
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    name_parts = safe_filename.rsplit('.', 1)
    if len(name_parts) == 2:
        timestamped_filename = f"{name_parts[0]}_{timestamp}.{name_parts[1]}"
    else:
        timestamped_filename = f"{safe_filename}_{timestamp}"
    
    file_path = student_path / timestamped_filename
    
    with open(file_path, 'wb') as f:
        f.write(content)
    
    return file_path


def clean_text_for_ingestion(text: str) -> str:
    """
    Clean text before chunking and embedding.
    
    Removes:
    - Excessive whitespace
    - Emojis and special unicode characters
    - Duplicate lines
    - Headers/footers (simple heuristic)
    
    Args:
        text: Raw text content
    
    Returns:
        Cleaned text
    """
    if not text:
        return ""
    
    # Remove emojis and special unicode
    # Keep basic punctuation and alphanumeric
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "]+",
        flags=re.UNICODE
    )
    text = emoji_pattern.sub(r'', text)
    
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    
    # Remove common headers/footers (simple heuristic)
    lines = text.split('\n')
    cleaned_lines = []
    seen_lines = set()
    
    for line in lines:
        stripped = line.strip()
        
        # Skip empty lines
        if not stripped:
            continue
        
        # Skip very short lines (likely headers/footers)
        if len(stripped) < 10:
            continue
        
        # Skip duplicate lines
        if stripped.lower() in seen_lines:
            continue
        
        seen_lines.add(stripped.lower())
        cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)


def get_student_upload_stats(university: str, roll_no: str, base_dir: str = "data") -> dict:
    """
    Get statistics about a student's uploaded files.
    
    Args:
        university: University code
        roll_no: Student roll number
        base_dir: Base directory for all student data
    
    Returns:
        Dictionary with file count, total size, and file list
    """
    student_path = get_student_data_path(university, roll_no, base_dir)
    
    if not student_path.exists():
        return {
            "file_count": 0,
            "total_size_bytes": 0,
            "files": []
        }
    
    files = []
    total_size = 0
    
    for file_path in student_path.iterdir():
        if file_path.is_file():
            stat = file_path.stat()
            files.append({
                "filename": file_path.name,
                "size_bytes": stat.st_size,
                "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat()
            })
            total_size += stat.st_size
    
    return {
        "file_count": len(files),
        "total_size_bytes": total_size,
        "files": sorted(files, key=lambda x: x["modified_at"], reverse=True)
    }

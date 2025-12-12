"""
Multi-Tenant Isolation Test Script

This script tests the data isolation between students to ensure
that Student A cannot access Student B's data.

Usage:
    python test_isolation.py
"""

import requests
import json
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000"

# Test students
STUDENT_A = {
    "university": "SCA",
    "roll_no": "AMIR001",
    "full_name": "Amir Khan",
    "password": "smart2025"  # University access code for SCA
}

STUDENT_B = {
    "university": "SCA",
    "roll_no": "DEV002",
    "full_name": "Dev Patel",
    "password": "smart2025"  # University access code for SCA
}


def login_student(student: Dict[str, str]) -> str:
    """Login and return JWT token"""
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json=student
    )
    response.raise_for_status()
    data = response.json()
    return data["access_token"]


def get_documents(token: str) -> Dict[str, Any]:
    """Get list of documents for the authenticated student"""
    response = requests.get(
        f"{BASE_URL}/documents",
        headers={"Authorization": f"Bearer {token}"}
    )
    response.raise_for_status()
    return response.json()


def self_test_isolation(token: str) -> Dict[str, Any]:
    """Call the self-test isolation endpoint"""
    response = requests.get(
        f"{BASE_URL}/self-test/isolation",
        headers={"Authorization": f"Bearer {token}"}
    )
    response.raise_for_status()
    return response.json()


def upload_sample_file(token: str, filename: str, content: str) -> Dict[str, Any]:
    """Upload a sample text file"""
    files = {
        'file': (filename, content.encode(), 'text/plain')
    }
    response = requests.post(
        f"{BASE_URL}/ingest-file",
        files=files,
        headers={"Authorization": f"Bearer {token}"}
    )
    response.raise_for_status()
    return response.json()


def run_isolation_test():
    """Run the complete isolation test"""
    print("=" * 80)
    print("MULTI-TENANT DATA ISOLATION TEST")
    print("=" * 80)
    print()
    
    # Step 1: Login as Student A
    print("Step 1: Logging in as Student A (Amir)...")
    token_a = login_student(STUDENT_A)
    print(f"✓ Student A logged in successfully")
    print()
    
    # Step 2: Upload document as Student A
    print("Step 2: Uploading document as Student A...")
    sample_content = """
    Machine Learning Fundamentals
    
    Machine learning is a subset of artificial intelligence that enables
    systems to learn and improve from experience without being explicitly
    programmed. Key concepts include:
    
    1. Supervised Learning - Learning from labeled data
    2. Unsupervised Learning - Finding patterns in unlabeled data
    3. Reinforcement Learning - Learning through trial and error
    
    Neural networks are the foundation of deep learning, consisting of
    interconnected nodes that process information in layers.
    """
    
    upload_result = upload_sample_file(token_a, "ml_notes_amir.txt", sample_content)
    print(f"✓ Document uploaded: {upload_result.get('chunks_added', 0)} chunks added")
    print()
    
    # Step 3: Check Student A's documents
    print("Step 3: Checking Student A's documents...")
    docs_a = get_documents(token_a)
    print(f"✓ Student A can see {docs_a['total_docs']} documents")
    print(f"  Sources: {[s['source'] for s in docs_a['sources']]}")
    print()
    
    # Step 4: Login as Student B
    print("Step 4: Logging in as Student B (Dev)...")
    token_b = login_student(STUDENT_B)
    print(f"✓ Student B logged in successfully")
    print()
    
    # Step 5: Check Student B's documents (should be ZERO from Student A)
    print("Step 5: Checking Student B's documents...")
    docs_b = get_documents(token_b)
    print(f"✓ Student B can see {docs_b['total_docs']} documents")
    print(f"  Sources: {[s['source'] for s in docs_b['sources']]}")
    print()
    
    # Step 6: Run self-test for both students
    print("Step 6: Running self-test isolation check...")
    print()
    
    print("--- Student A Isolation Test ---")
    test_a = self_test_isolation(token_a)
    print(f"Student: {test_a['student']['full_name']} ({test_a['student']['roll_no']})")
    print(f"Visible documents: {test_a['visible_data']['document_count']}")
    print(f"Document sources: {len(test_a['visible_data']['document_sources'])}")
    print(f"Isolation status: {test_a['isolation_status']['vector_store']}")
    print()
    
    print("--- Student B Isolation Test ---")
    test_b = self_test_isolation(token_b)
    print(f"Student: {test_b['student']['full_name']} ({test_b['student']['roll_no']})")
    print(f"Visible documents: {test_b['visible_data']['document_count']}")
    print(f"Document sources: {len(test_b['visible_data']['document_sources'])}")
    print(f"Isolation status: {test_b['isolation_status']['vector_store']}")
    print()
    
    # Step 7: Verify isolation
    print("=" * 80)
    print("ISOLATION VERIFICATION")
    print("=" * 80)
    print()
    
    student_a_docs = test_a['visible_data']['document_count']
    student_b_docs = test_b['visible_data']['document_count']
    
    if student_a_docs > 0 and student_b_docs == 0:
        print("✅ ISOLATION TEST PASSED!")
        print(f"   - Student A has {student_a_docs} document(s)")
        print(f"   - Student B has {student_b_docs} documents")
        print(f"   - Student B CANNOT see Student A's data ✓")
        return True
    elif student_a_docs == 0:
        print("⚠️  WARNING: Student A has no documents")
        print("   Upload may have failed. Check backend logs.")
        return False
    elif student_b_docs > 0:
        print("❌ ISOLATION TEST FAILED!")
        print(f"   - Student B can see {student_b_docs} documents")
        print(f"   - This may include Student A's data!")
        print(f"   - DATA LEAKAGE DETECTED ✗")
        return False
    else:
        print("⚠️  UNEXPECTED STATE")
        print(f"   - Student A docs: {student_a_docs}")
        print(f"   - Student B docs: {student_b_docs}")
        return False


if __name__ == "__main__":
    try:
        success = run_isolation_test()
        exit(0 if success else 1)
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Cannot connect to backend server")
        print(f"   Make sure the server is running at {BASE_URL}")
        exit(1)
    except requests.exceptions.HTTPError as e:
        print(f"❌ HTTP ERROR: {e}")
        print(f"   Response: {e.response.text if hasattr(e, 'response') else 'N/A'}")
        exit(1)
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)

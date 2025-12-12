"""
Example script to ingest a PDF file into the vector store.
"""
import requests

# Quick local test (after starting the server):
# python run_example_ingest.py path/to/file.pdf

import sys

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python run_example_ingest.py path/to/file.pdf")
        sys.exit(1)
    path = sys.argv[1]
    with open(path, 'rb') as f:
        files = {'file': (path, f, 'application/pdf')}
        r = requests.post('http://localhost:8000/ingest-file', files=files)
        print(r.status_code, r.text)

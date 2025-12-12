# Smart Campus Assistant - Frontend

Minimal React + Vite frontend for the Smart Campus Assistant MVP.

## Features
- 📤 **Upload**: Drag-and-drop file upload (PDF/text)
- 💬 **Ask**: Interactive Q&A with your documents
- 📝 **Summary**: AI-generated summaries and flashcards
- ✏️ **Quiz**: Adaptive quiz generation

## Setup

Install dependencies:
```powershell
cd C:\Users\Welcome\Desktop\project\frontend
npm install
```

## Run

Start the dev server (proxies API calls to backend on port 8000):
```powershell
npm run dev
```

Open: http://localhost:5173

## Backend

Ensure the FastAPI backend is running on port 8000:
```powershell
cd C:\Users\Welcome\Desktop\project\backend
$venv = Join-Path $PWD ".venv"
& (Join-Path $venv "Scripts\python.exe") -m uvicorn app.main:app --reload --port 8000
```

## Build for Production

```powershell
npm run build
npm run preview
```

## Tech Stack
- React 18
- Vite 6
- Native fetch API for backend communication
- CSS3 with gradient theming

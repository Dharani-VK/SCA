
# Study Studio - Demo Script & API Usage

## Demo Script
1. **Login** to the application as a student.
2. **Upload** a document (PDF/DOCX) related to "Machine Learning" if you haven't already.
3. **Click** on "Study Studio" in the left sidebar.
4. **Enter Topic**: Type "Gradient Descent" in the Magic Prompt Ring and hit Enter.
5. **Observe**:
   - The ring expands.
   - A "Building your guide..." loader appears with a "Fast Preview" of text snippet.
   - Once ready, the Summary Canvas appears with tabs: Overview, Concepts, Practice.
6. **Interact**:
   - Click "Concepts" to see extracted key terms.
   - Click the "Voice Avatar" (bottom right) to start audio narration.

## API Reference (Postman/cURL)

### 1. Create Summary
**POST** `/study-studio/summarize`
```json
{
  "topic": "Gradient Descent",
  "style": "medium",
  "voice": "default",
  "request_audio": true
}
```

### 2. Verify Status (Long Polling)
**GET** `/study-studio/summary/{summary_id}`

### 3. Follow Up
**POST** `/study-studio/summarize/followup`
```json
{
  "summary_id": "{summary_id}",
  "action": "simplify"
}
```

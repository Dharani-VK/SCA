# 🔧 Backend Connectivity Troubleshooting Guide

## Quick Diagnosis

You're seeing this error:
```
Unable to reach the assistant backend at http://127.0.0.1:8000
```

## ✅ Step 1: Verify Backend is Running

```bash
curl http://127.0.0.1:8000/health
```

**Expected response**: `{"status":"ok"}`

If this works, the backend is running fine! ✅

## ✅ Step 2: Use the Diagnostic Tool

I've created a diagnostic page for you:

1. Open your browser
2. Navigate to: `file:///c:/Users/Welcome/Desktop/project/frontend/diagnostic.html`
3. Click through each test button:
   - Test 1: Health Check
   - Test 2: CORS Test
   - Test 3: Authentication
   - Test 4: File Upload

This will show you exactly where the issue is!

## Common Issues & Solutions

### Issue 1: Frontend Not Connecting to Backend

**Symptoms**: Error in browser console, fetch fails

**Solution**:
1. Ensure backend is running: `cd backend && uvicorn app.main:app --reload`
2. Ensure frontend is running: `cd frontend && npm run dev`
3. Check that ports match:
   - Backend: `http://127.0.0.1:8000`
   - Frontend: `http://localhost:5173`

### Issue 2: CORS Preflight Failure

**Symptoms**: Browser console shows CORS error

**Solution**: Backend already has CORS enabled. If you still see errors:
1. Clear browser cache
2. Try in incognito mode
3. Check browser console for specific CORS error

### Issue 3: Network Error

**Symptoms**: `TypeError: Failed to fetch`

**Possible Causes**:
1. **Backend not running** → Start backend
2. **Wrong URL** → Check `frontend/src/utils/constants.ts`
3. **Firewall blocking** → Temporarily disable firewall
4. **Antivirus blocking** → Add exception for localhost

### Issue 4: File Upload Specific

**Symptoms**: Other endpoints work, but upload fails

**Solution**:
1. Check file size (backend may have limits)
2. Check file type (PDF, TXT supported)
3. Ensure you're logged in (JWT token required)
4. Check backend logs for specific error

## 🔍 Detailed Debugging Steps

### 1. Check Backend Status

```powershell
# Check if backend process is running
netstat -ano | findstr :8000

# Should show LISTENING on port 8000
```

### 2. Check Frontend Status

```powershell
# Check if frontend process is running
netstat -ano | findstr :5173

# Should show LISTENING on port 5173
```

### 3. Test Backend Directly

```powershell
# Test health endpoint
curl http://127.0.0.1:8000/health

# Test login
curl -X POST http://127.0.0.1:8000/auth/login `
  -H "Content-Type: application/json" `
  -d '{"university":"SCA","roll_no":"TEST","full_name":"Test","password":"smart2025"}'
```

### 4. Check Browser Console

1. Open browser (F12)
2. Go to Console tab
3. Look for errors (red text)
4. Common errors:
   - `CORS policy` → CORS issue
   - `Failed to fetch` → Network issue
   - `401 Unauthorized` → Auth issue
   - `500 Internal Server Error` → Backend error

### 5. Check Backend Logs

Look at the terminal where backend is running. You should see:
```
INFO:     127.0.0.1:xxxxx - "POST /ingest-file HTTP/1.1" 200 OK
```

If you see `500` or `400`, there's a backend error.

## 🚀 Quick Fix Checklist

- [ ] Backend is running (`uvicorn app.main:app --reload`)
- [ ] Frontend is running (`npm run dev`)
- [ ] Backend responds to health check
- [ ] You're logged in (have JWT token)
- [ ] File is supported format (PDF, TXT)
- [ ] No firewall blocking localhost
- [ ] Browser console shows no CORS errors

## 🎯 Most Likely Solution

Based on the error message, the most common cause is:

**The frontend is trying to upload BEFORE you're logged in**

### Solution:
1. Go to the frontend: `http://localhost:5173`
2. **Login first** (very important!)
3. Then navigate to Upload page
4. Try uploading again

The upload endpoint requires authentication. If you're not logged in, the request will fail.

## 📊 Use the Diagnostic Tool

The easiest way to diagnose is to use the diagnostic page:

```
file:///c:/Users/Welcome/Desktop/project/frontend/diagnostic.html
```

This will test:
1. ✅ Backend health
2. ✅ CORS configuration
3. ✅ Authentication
4. ✅ File upload

And show you exactly where the problem is!

## 🆘 Still Having Issues?

If none of the above works:

1. **Restart both servers**:
   ```bash
   # Kill both processes
   # Restart backend
   cd backend
   uvicorn app.main:app --reload
   
   # Restart frontend (new terminal)
   cd frontend
   npm run dev
   ```

2. **Clear browser cache**:
   - Ctrl+Shift+Delete
   - Clear all cached data
   - Restart browser

3. **Try incognito mode**:
   - Rules out browser extension issues
   - Fresh session

4. **Check the diagnostic page**:
   - Will show exact error
   - Easier to debug

## 📝 Summary

**Backend Status**: ✅ Running and healthy  
**CORS**: ✅ Properly configured  
**Most Likely Issue**: Not logged in or network error  

**Next Steps**:
1. Open diagnostic page
2. Run all tests
3. See which one fails
4. Follow the specific solution

---

**Diagnostic Page**: `file:///c:/Users/Welcome/Desktop/project/frontend/diagnostic.html`  
**Backend Health**: `http://127.0.0.1:8000/health`  
**Frontend**: `http://localhost:5173`

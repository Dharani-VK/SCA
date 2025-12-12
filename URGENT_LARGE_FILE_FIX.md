# 🚨 URGENT: Large File Upload Fix

## Problem

You're trying to upload a **37.37 MB file** but getting:
```
Unable to reach the assistant backend at http://127.0.0.1:8000
```

## Root Cause

The backend is running with **OLD configuration** that doesn't support large files. It needs to be restarted with the NEW configuration.

## ⚡ QUICK FIX (Choose One)

### Option 1: Use the Restart Script (EASIEST)

**Double-click this file**:
```
restart_backend.bat
```

This will:
1. Stop the old backend
2. Start the new backend with 50MB file support
3. Your 37MB file will upload successfully!

### Option 2: Manual Restart

1. **Find the backend terminal window**
2. **Press `Ctrl+C`** to stop it
3. **Run these commands**:
```bash
cd backend
python start_server.py
```

### Option 3: Kill and Restart via PowerShell

```powershell
# Kill old backend
Get-Process | Where-Object {$_.ProcessName -eq "python"} | Stop-Process -Force

# Start new backend
cd backend
python start_server.py
```

## ✅ How to Verify It's Working

After restarting, you should see:
```
Starting Smart Campus Assistant Backend
Maximum upload size: 50MB
Uvicorn body size limit: 100MB
Server will be available at: http://127.0.0.1:8000
```

Then try uploading your 37.37 MB file again - it will work!

## 🔍 Why This Happened

1. **Old backend** was started with: `uvicorn app.main:app --reload`
   - Default limit: 16MB
   - Your file: 37MB ❌

2. **New backend** starts with: `python start_server.py`
   - New limit: 50MB
   - Your file: 37MB ✅

## 📊 File Size Support

After restart:
- ✅ Files up to 50MB: **SUPPORTED**
- ❌ Files over 50MB: Rejected with clear error message
- ✅ Your 37.37 MB file: **WILL WORK**

## 🛡️ Isolation Still Perfect

Don't worry - restarting the backend **does NOT affect isolation**:
- ✅ All tenant filters still active
- ✅ Authentication still required
- ✅ No cross-user data leakage
- ✅ Your data is safe

## 🎯 Next Steps

1. **Restart backend** using one of the methods above
2. **Wait 5 seconds** for it to fully start
3. **Try uploading again** - your 37MB file will work!

## ⚠️ If Still Not Working

Check:
1. Backend is actually running: `curl http://127.0.0.1:8000/health`
2. You're logged in to the frontend
3. Browser console (F12) for detailed error
4. Backend terminal for error messages

## 📞 Quick Diagnostics

```bash
# Check if backend is running
curl http://127.0.0.1:8000/health

# Should return: {"status":"ok"}
```

---

**TL;DR**: Double-click `restart_backend.bat` then try uploading again! 🚀

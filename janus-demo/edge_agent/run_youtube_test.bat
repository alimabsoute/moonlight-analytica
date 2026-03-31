@echo off
REM ============================================================
REM YouTube Stream Test Script
REM ============================================================
REM Tests YouTube video streaming functionality with Janus
REM ============================================================

cd /d "%~dp0"

echo ============================================================
echo JANUS YOUTUBE STREAMING TEST
echo ============================================================
echo.

REM Check if virtual environment exists
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) else (
    echo [WARNING] Virtual environment not found. Using system Python.
)

REM Test video URLs (public, crowd/people walking videos)
set TEST_URL_1=https://www.youtube.com/watch?v=wqctLW0Hb_0
set TEST_URL_2=https://www.youtube.com/watch?v=AdUw5RdyZxI

echo Testing yt-dlp installation...
python -c "import yt_dlp; print(f'yt-dlp version: {yt_dlp.version.__version__}')"
if errorlevel 1 (
    echo [ERROR] yt-dlp not installed. Installing...
    pip install -U yt-dlp
)

echo.
echo Testing YouTube URL extraction...
echo URL: %TEST_URL_1%
echo.

python -c "import yt_dlp; ydl = yt_dlp.YoutubeDL({'format': 'best[height<=720]/best', 'quiet': True}); info = ydl.extract_info('%TEST_URL_1%', download=False); print(f'Title: {info.get(\"title\", \"Unknown\")}'); print(f'Duration: {info.get(\"duration\", 0)}s'); print(f'Stream URL found: {bool(info.get(\"url\") or info.get(\"formats\"))}')"

if errorlevel 1 (
    echo.
    echo [ERROR] YouTube extraction failed.
    echo Possible causes:
    echo   - Video is private or age-restricted
    echo   - Geographic restrictions
    echo   - yt-dlp needs update: pip install -U yt-dlp
    echo.
) else (
    echo.
    echo [SUCCESS] YouTube streaming is working!
    echo.
    echo To run tracking with YouTube video:
    echo   python video_streamer.py --youtube "%TEST_URL_1%" --port 8001
    echo.
    echo Or use the enhanced agent:
    echo   python edge_agent_enhanced.py --youtube "%TEST_URL_1%" --backend http://localhost:8000
)

echo.
pause

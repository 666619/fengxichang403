@echo off
rem Author: Feng Xicheng / 24001010403 / 2026-11-19 / DeepSeek-V4.1-Flash
rem Purpose: start backend server; switch to backend dir, use UTF-8 console, pause on exit.
rem Note: this bat is ASCII-only on purpose - cmd parses the file with the OEM code page
rem       before chcp takes effect, so non-ASCII text here would be garbled or break parsing.

chcp 65001 >nul
title Advanced Web Design - Backend 8403

rem %~dp0 is this bat's folder (with trailing backslash), so double-click works from any cwd
cd /d "%~dp0backend"

echo [bat] cwd: %CD%
echo [bat] run: npm start  (same as node server.js)
echo.

rem keep in sync with scripts.start in package.json
npm start

echo.
echo [bat] server exited with code %ERRORLEVEL%
pause

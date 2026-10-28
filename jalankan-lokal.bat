@echo off
set "PORTABLE_NODE=C:\Users\Arif\.gemini\antigravity\scratch\tools\node-v22.23.4-win-x64"
if exist "%PORTABLE_NODE%\node.exe" set "PATH=%PORTABLE_NODE%;%PATH%"
cd /d "%~dp0"
echo Menjalankan EksporFlow di http://localhost:3000 ...
call pnpm.cmd dev

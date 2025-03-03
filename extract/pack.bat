@echo off
setlocal

:: 1. Node.js path (if needed, remove if not relevant)
set "NODE_DIR=C:\Program Files\nodejs"
if exist "%NODE_DIR%\node.exe" (
    set "PATH=%NODE_DIR%;%PATH%"
)

:: 2. Path to javascript-obfuscator CMD
set "OBF_CMD=C:\Users\allen\AppData\Roaming\npm\javascript-obfuscator.cmd"

:: Default input/output
set "INPUT=%~dp0..\script.js"
set "OUTPUT=%~dp0..\output\output.js"
if not exist "%~dp0..\output" (
    mkdir "%~dp0..\output"
)

echo Extracting header from %INPUT%...
powershell -NoProfile -Command ^
    "$content = Get-Content '%INPUT%' -Raw -Encoding utf8; " ^
    "$start = $content.IndexOf('// ==UserScript=='); $end = $content.IndexOf('// ==/UserScript==')+1; " ^
    "if($start -lt 0 -or $end -lt 0) { Write-Error 'Header not found'; exit 1 } " ^
    "$header = $content.Substring($start, ($end + 17) - $start); " ^
    "$header | Out-File -Encoding utf8 header.js"

echo After extracting header, errorlevel=%errorlevel%
if errorlevel 1 (
    echo Failed to extract header.
    pause
    exit /b 1
)

echo Extracting body (code without header)...
powershell -NoProfile -Command ^
    "$content = Get-Content '%INPUT%' -Raw -Encoding utf8; " ^
    "$start = $content.IndexOf('// ==UserScript=='); $end = $content.IndexOf('// ==/UserScript==')+1; " ^
    "if($start -lt 0 -or $end -lt 0) { $content | Out-File -Encoding utf8 body.js } else { " ^
    "$headLen = ($end + 17) - $start; " ^
    "$body = $content.Remove($start, $headLen); $body | Out-File -Encoding utf8 body.js }"

echo After extracting body, errorlevel=%errorlevel%
if errorlevel 1 (
    echo Failed to extract body.
    pause
    exit /b 1
)

echo Obfuscating code with %OBF_CMD% ...
call "%OBF_CMD%" "body.js" --compact true --control-flow-flattening true --self-defending true --output "obfuscated.js"
echo After obfuscation, errorlevel=%errorlevel%
if errorlevel 1 (
    echo Obfuscation failed.
    pause
    exit /b 1
)

echo Checking if obfuscated.js exists...
if not exist "obfuscated.js" (
    echo obfuscated.js not found, something went wrong.
    pause
    exit /b 1
)

echo Combining header.js and obfuscated.js into %OUTPUT%...
type header.js > "%OUTPUT%"
echo. >> "%OUTPUT%"
type obfuscated.js >> "%OUTPUT%"

echo After combine, errorlevel=%errorlevel%

echo Cleaning up...
del header.js
del body.js
del obfuscated.js

echo Obfuscated Tampermonkey script written to %OUTPUT%.
endlocal
pause
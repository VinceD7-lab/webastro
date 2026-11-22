@echo off
rem Lance le serveur de developpement en arriere-plan (aucune fenetre de commande)
rem et ouvre http://localhost:4321/webastro/ dans le navigateur.
rem Sortie du serveur : dev.log. Arret : stop_app.bat.
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js est introuvable. Installez Node.js 22.12 ou plus recent : https://nodejs.org
  pause
  exit /b 1
)

rem Deja lance ?
netstat -ano | findstr /R /C:":4321 .*LISTENING" >nul
if not errorlevel 1 (
  echo Le serveur tourne deja sur le port 4321.
  start "" "http://localhost:4321/webastro/"
  exit /b 0
)

if not exist node_modules (
  echo Installation des dependances...
  call npm install
  if errorlevel 1 (
    echo L'installation a echoue.
    pause
    exit /b 1
  )
)

echo Demarrage du serveur...
powershell -NoProfile -Command "Start-Process -FilePath cmd.exe -ArgumentList '/c','npm run dev -- --port 4321 > dev.log 2>&1' -WorkingDirectory '%~dp0' -WindowStyle Hidden"

rem Attend que le serveur reponde (60 s au maximum).
for /l %%I in (1,1,60) do (
  netstat -ano | findstr /R /C:":4321 .*LISTENING" >nul
  if not errorlevel 1 goto pret
  timeout /t 1 >nul
)
echo Le serveur ne repond pas apres 60 secondes. Derniere sortie :
echo.
type dev.log
echo.
pause
exit /b 1

:pret
start "" "http://localhost:4321/webastro/"
echo Serveur pret : http://localhost:4321/webastro/
timeout /t 2 >nul
exit /b 0

@echo off
rem Arrete le serveur de developpement lance par start_app.bat (processus et son interpreteur cache).
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ports = 4321..4323; $arret = $false;" ^
  "foreach ($c in Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort }) {" ^
  "  $cible = $c.OwningProcess;" ^
  "  $p = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $cible);" ^
  "  while ($p -and $p.ParentProcessId) {" ^
  "    $pere = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $p.ParentProcessId);" ^
  "    if (-not $pere) { break };" ^
  "    if ($pere.Name -eq 'cmd.exe' -and $pere.CommandLine -like '*npm run dev*') { $cible = $pere.ProcessId; break };" ^
  "    if ($pere.Name -notin 'node.exe','npm.cmd','cmd.exe') { break };" ^
  "    $p = $pere" ^
  "  };" ^
  "  taskkill /PID $cible /T /F | Out-Null; $arret = $true" ^
  "};" ^
  "if ($arret) { 'Serveur arrete.' } else { 'Aucun serveur actif sur les ports 4321 a 4323.' }"
timeout /t 2 >nul
exit /b 0

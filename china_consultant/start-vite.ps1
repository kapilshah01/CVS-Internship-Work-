$ErrorActionPreference = 'Stop'
Set-Location 'C:\Users\kapil\OneDrive\Desktop\China_consult_ver-2.0\china_consultant'
$npm = 'C:\Program Files\nodejs\npm.cmd'
& $npm run dev -- --host 0.0.0.0 --port 5173 *>> 'vite.log'

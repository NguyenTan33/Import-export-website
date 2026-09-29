@echo off
chcp 65001 >nul
title WebXNK - Khoi dong Backend va Frontend
set "PATH=C:\Program Files\nodejs;%PATH%"

echo ======================================================================
echo    KHOI DONG HE THONG WEB XUAT NHAP KHAU QUOC TE (WEBXNK.COM)
echo ======================================================================
echo.
echo [1/2] Dang khoi dong Backend .NET 9 API (Cong 5000)...
start "WebXNK Backend API" cmd /k "cd /d ""%~dp0src\WebXNK.Api"" && dotnet run"

echo [2/2] Dang khoi dong Frontend Next.js 14 (Cong 3000)...
start "WebXNK Frontend Client" cmd /k "set ""PATH=C:\Program Files\nodejs;%PATH%"" && cd /d ""%~dp0src\webxnk-client"" && npm run dev"

echo.
echo Dang doi he thong khoi chay (8 giay)...
timeout /t 8 >nul
start http://localhost:3000
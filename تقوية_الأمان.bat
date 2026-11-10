@echo off
:: ============================================================
::  تقوية أمان الويندز — انقر نقرتين كمسؤول
::  Windows Security Hardening — Double-click as Administrator
:: ============================================================
echo =============================================
echo   تقوية أمان الويندز
echo   Windows Security Hardening
echo   Run as Administrator
echo =============================================
echo.
echo جاري التشغيل بصلاحيات مدير...
echo Running with admin privileges...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%~dp0SECURITY_HARDEN.ps1\"'"
if %errorlevel% neq 0 (
    echo.
    echo [!] فشل التشغيل - تأكد من تشغيل الملف كمسؤول
    echo [!] Failed - make sure to Run as Administrator
    pause
)

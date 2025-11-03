@echo off
title 🚀 Lancement des microservices FitnessBro
echo =============================================
echo   Démarrage des services FitnessBro...
echo =============================================

REM -- Auth Service (port 8001)
start powershell -NoExit -Command "cd auth-service; venv\Scripts\activate; uvicorn app.main:app --reload --port 8001"

REM -- Program Service (port 8002)
start powershell -NoExit -Command "cd program-service; venv\Scripts\activate; uvicorn app.main:app --reload --port 8002"

REM -- Tracking Service (port 8003)
start powershell -NoExit -Command "cd tracking-service; venv\Scripts\activate; uvicorn app.main:app --reload --port 8003"

echo.
echo ✅ Tous les services sont en cours d'exécution.
echo   - Auth:        http://127.0.0.1:8001
echo   - Programmes:  http://127.0.0.1:8002
echo   - Tracking:    http://127.0.0.1:8003
echo.
pause

@echo off

:: Устанавливаем текущую директорию как путь, где находится этот скрипт
set "script_dir=%~dp0"

:: Переход в директорию backend и запуск серверного приложения
set "backend_path=%script_dir%"
cd "%backend_path%"
start http://localhost:3000/
if exist server.js (
    echo Запуск сервера...
    node server.js
) else (
    echo Ошибка: Файл server.js не найден в папке
    exit /b 1
)

:: Завершение
exit /b 0
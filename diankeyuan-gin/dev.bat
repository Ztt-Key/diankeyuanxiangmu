@echo off
start powershell -NoExit -Command "cd web; pnpm serve"
start powershell -NoExit -Command "cd server; go run ."

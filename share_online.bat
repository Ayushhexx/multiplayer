@echo off
title GTA Vice City Online Tunnel
echo ========================================================
echo        🌴 GTA VICE CITY ONLINE PUBLIC LINK 🌴
echo ========================================================
echo Generating instant public HTTPS link...
echo Share the generated URL with your friends anywhere!
echo Keep this window open while playing.
echo ========================================================
ssh -p 443 -o StrictHostKeyChecking=no -R0:localhost:8000 a.pinggy.io
pause

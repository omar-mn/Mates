#!/bin/bash

python3 manage.py makemigrations
python3 manage.py migrate
gunicorn -k uvicorn.workers.UvicornWorker chat.asgi:application -w 4 -b 0.0.0.0:8080
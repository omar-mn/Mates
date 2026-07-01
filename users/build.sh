#!/bin/bash

python3 manage.py makemigrations
python3 manage.py migrate
gunicorn users.wsgi:application -w 4 -b 0.0.0.0:8000
FROM python:3.11.15-alpine3.22

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

RUN chmod +x build.sh

CMD ["/bin/sh", "./build.sh"]
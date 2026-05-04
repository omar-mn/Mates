from celery import shared_task
from redis import Redis
import json

red = Redis(host="redis", port=6379, decode_responses=True)

@shared_task
def publish_user_upserted(id, username, avatar_url):
    event = {
        "type": "UserUpserted",
        "id": id,
        "username": username,
        "avatar_url": avatar_url,
    }
    red.publish("user_events", json.dumps(event))
from celery import shared_task
from redis import Redis
import json
from .models import UserSnapshot

r = Redis(host="redis", port=6379, decode_responses=True)

@shared_task(name='users_app.tasks.publish_user_upserted')
def handle_user_upsert(id, username, avatar_url):
    UserSnapshot.objects.update_or_create(
        id=id,
        defaults={
            "username": username,
            "avatar_url": avatar_url,
        },
    )
    print(f"Successfully synced user: {username}")
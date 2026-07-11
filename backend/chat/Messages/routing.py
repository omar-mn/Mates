from .consumer import MessageConsumer
from django.urls import path

ws_urls= [
    path('ws/message/<int:room_id>/' , MessageConsumer.as_asgi()),
]
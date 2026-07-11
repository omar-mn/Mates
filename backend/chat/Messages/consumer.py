import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from Rooms.models import Room, MemberShip
from .models import Message
from .serializers import MessageSerializer
from rest_framework.response import Response

class MessageConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return Response({'error' : 'fuck off bitchy'})

        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"room_{self.room_id}"

        is_member = await self.user_is_member(self.user.id, self.room_id)

        if not is_member:
            await self.close()
            return Response({'error' : 'fuck off bitchy'})

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        
        
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Invalid JSON"
            }))
            return

        content = data.get("content", "").strip()

        if not content:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Message content is required"
            }))
            return

        message_data = await self.create_message(
            user_id=self.user.id,
            room_id=self.room_id,
            content=content
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message_data
            }
        )

    async def chat_message(self, event):
        if not self.user.is_authenticated:
            await self.close()
            return Response("fuck off")
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "message": event["message"]
        }))

    @database_sync_to_async
    def user_is_member(self, user_id, room_id):
        return MemberShip.objects.filter(
            user_id=user_id,
            room_id=room_id,
            leftDate__isnull=True
        ).exists()

    @database_sync_to_async
    def create_message(self, user_id, room_id, content):
        room = Room.objects.get(pk=room_id)

        message = Message.objects.create(
            user_id=user_id,
            room=room,
            content=content
        )

        return MessageSerializer(message, context={"request": None}).data
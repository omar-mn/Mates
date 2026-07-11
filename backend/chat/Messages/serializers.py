from rest_framework import serializers
from .models import Message , FeedBackMessage 
from Rooms.serializers import RoomUser
from Rooms.models import UserSnapshot

class MessageSerializer(serializers.ModelSerializer):
    user = RoomUser(read_only=True)
    class Meta:
        model   = Message
        fields  = ('id' , 'content','sent_at' , 'user')
        read_only_fields = ('user', 'room')
    
    def create(self, validated_data):
        user_id    = self.context['request'].user.id
        user = UserSnapshot.objects.filter(id=user_id).first()
        room = self.context['Room']
        message = Message.objects.create(user = user , room = room , **validated_data)
        return message
    

class ModMessageSerializer(serializers.ModelSerializer):

    class Meta:
        model = Message
        fields  = ('id' , 'content','sent_at' , 'user')
        read_only_fields = (['user'])


class FeedBack(serializers.ModelSerializer):    
    user = RoomUser(read_only=True)
    class Meta:
        model = FeedBackMessage
        fields = ('id' , 'content','sent_at' , 'user')

    def create(self, validated_data):
        user_id    = self.context['request'].user.id
        user = UserSnapshot.objects.filter(id=user_id).first()
        message = FeedBackMessage.objects.create(user = user , **validated_data)
        return message
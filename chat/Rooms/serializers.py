from .models import Room , MemberShip , JoinRequest , UserSnapshot 
from rest_framework import serializers


class RoomUser(serializers.ModelSerializer):
    class Meta:
        model = UserSnapshot
        fields = ('id' , 'username' , 'avatar_url')


# ALL ROOMS
class ViewRooms(serializers.ModelSerializer):
    is_member   = serializers.SerializerMethodField()
    owner       = RoomUser(read_only=True)
    members     = serializers.SerializerMethodField()
    membersCount = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ('id' , 'name' , 'description' , 'category' , 'is_member' , 'private' , 'membersCount' , 'owner' ,'members')

    def get_is_member(self,obj):
        user_id    = self.context['request'].user.id
        user = UserSnapshot.objects.filter(id=user_id).first()
        return MemberShip.objects.filter(
            user             = user,
            room             = obj,
            leftDate__isnull = True
        ).exists()
    
    def get_members(self,obj):
        MeS = MemberShip.objects.filter(room = obj.id , leftDate = None).order_by('joinDate')[:5]
        members = Join_MS(MeS , many = True)
        return members.data 
    
    def get_membersCount(self,obj):
        MeS = MemberShip.objects.filter(room = obj.id , leftDate = None).count()
        return MeS


# CREATE ROOM
class CreateRoom(serializers.ModelSerializer):
    
    owner       = RoomUser(read_only=True)

    class Meta:
        model = Room
        fields = ('id','name' , 'description' , 'category' , 'owner' , 'private')
    
    def create(self, validated_data):
        user_id = self.context['request'].user.id
        user = UserSnapshot.objects.filter(id=user_id).first()
        room = Room.objects.create(owner = user , **validated_data)
        MemberShip.objects.create(user = room.owner , room = room , role = 'owner')
        return room


# EDITE OR GET ROOM
class RoomMod(serializers.ModelSerializer):

    owner       = RoomUser(read_only=True)
    members     = serializers.SerializerMethodField()
    membersCount = serializers.SerializerMethodField()


    class Meta:
        model = Room
        fields = ('id','name' , 'description' , 'category' , 'private' , 'membersCount' , 'owner' , 'members')

    def get_members(self,obj):
        MeS = MemberShip.objects.filter(room = obj.id , leftDate = None)
        members = Join_MS(MeS , many = True)
        return members.data
    
    def get_membersCount(self,obj):
        MeS = MemberShip.objects.filter(room = obj.id , leftDate = None).count()
        return MeS


# JOIN ROOM (MEMBER SHIP)
class Join_MS(serializers.ModelSerializer):
    user = RoomUser(read_only=True)
    class Meta:
        model = MemberShip
        fields = ('user' , 'room' , 'role' , 'leftDate')
        read_only_fields = (['user' , 'room' , 'role'])

    def create(self, validated_data):
        user_id    = self.context['request'].user.id
        user = UserSnapshot.objects.filter(id=user_id).first()
        room = self.context['room']
        MeS = MemberShip.objects.create(user = user , room = room , role = 'member' , **validated_data)
        return MeS


# NESTED ROOMS FOR REQUESTS

class roomREQ(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ('id', 'name' , 'category' , 'private')


# REQUESTS
class Request_Join(serializers.ModelSerializer):
    room = roomREQ(read_only=True)
    user = RoomUser(read_only=True) 
    class Meta:
        model = JoinRequest
        fields = ('id' , 'user' , 'room' , 'state')


# NESTED ROOMS FOR JOINED ROOMS

class roomJOIN(serializers.ModelSerializer):
    owner       = RoomUser(read_only=True)
    membersCount = serializers.SerializerMethodField()
    class Meta:
        model = Room
        fields = ('id', 'name' , 'category' , 'private' , 'membersCount' , 'owner')
    
    def get_membersCount(self,obj):
        MeS = MemberShip.objects.filter(room = obj.id , leftDate = None).count()
        return MeS

# JOINED ROOMS
class JoinedRoomsSerializer(serializers.ModelSerializer):
    room = roomJOIN(read_only=True)
    class Meta:
        model  = MemberShip
        fields = ('room' , 'role')
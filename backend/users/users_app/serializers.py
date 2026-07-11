from rest_framework import serializers 
from .models import account
from django.contrib.auth.hashers import make_password
from dj_rest_auth.serializers import UserDetailsSerializer
from rest_framework import serializers

class RoomUser(serializers.ModelSerializer):
    class Meta:
        model = account
        fields = ('id' , 'username' , 'profileImage')

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = account
        fields = ('username' , 'email', 'first_name' , 'last_name' , 'profileImage' , 'profile_banner')
        read_only_fields = (['email' , 'username'])

class CustomUserDetailsSerializer(UserDetailsSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta(UserDetailsSerializer.Meta):
        model = account
        fields = ('full_name', 'username' , 'email', 'first_name' , 'last_name' , 'profileImage' , 'profile_banner' , 'bio')
        read_only_fields = ('email', 'full_name')

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class Profile(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = account
        fields = ('full_name', 'username' , 'first_name' , 'last_name' , 'profileImage' , 'profile_banner' , 'bio')
        read_only_fields = ('email', 'full_name')

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

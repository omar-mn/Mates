from django.shortcuts import render
# from .serializers import Sign_UpSerializer , UserInfo , JoinRoom
from rest_framework.decorators import api_view , permission_classes
from rest_framework.permissions import AllowAny , IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import account
from .serializers import Profile


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def GetProfile(request , pk):

    try:
        user = account.objects.get(pk = pk)
    except account.DoesNotExist:
        return Response({"message" : "this user doesn't exist"} , status=status.HTTP_404_NOT_FOUND)
    
    serializer = Profile(user)
    return Response(serializer.data)
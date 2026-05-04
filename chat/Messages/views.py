from rest_framework.decorators import api_view , permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from Rooms.models import Room
from .serializers import MessageSerializer , ModMessageSerializer , FeedBack
from .models import Message
from chat.permissions import IsMessageOwner , IsRoomMember , CanDeleteMessage
from rest_framework.pagination import PageNumberPagination
from rest_framework import status


# ROOM MESSAGES

@api_view(['GET'])
@permission_classes([IsAuthenticated , IsRoomMember])
def Messages(request , pk):

    try:
        room = Room.objects.get(pk = pk)
    except Room.DoesNotExist:
        return Response({"error" : "this room doesnt exist"})
    
    messages = Message.objects.filter(room = room).order_by("sent_at")
    pagintaor = PageNumberPagination()
    pagintaor.page_size = 100
    queryset = pagintaor.paginate_queryset(messages,request)
    serializer = MessageSerializer(queryset , many=True , context={"request": request})
    return Response(serializer.data)


# SEND MESSAGE

@api_view(['POST'])
@permission_classes([IsAuthenticated , IsRoomMember])
def CreateMessage(request , pk):

    try:
        room = Room.objects.get(pk = pk)
    except Room.DoesNotExist:
        return Response({"error" : "this room doesnt exist"})
    
    serializer = MessageSerializer( data = request.data , context = {"request": request , "Room":room })
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    else:
        return Response(serializer.errors)
    


# MOD MESSAGE

@api_view(['PUT'])
@permission_classes([IsAuthenticated , IsMessageOwner , IsRoomMember])
def ModMessage(request , pkR , pkM):

    try:
        message = Message.objects.get(pk = pkM , room_id = pkR)
    except Message.DoesNotExist:
        return Response({"eorro" : "this message doesnt exist"})
    
    serializer = ModMessageSerializer(message , data = request.data , partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"message edited"})
    else:
        return Response(serializer.errors)


# DLETE MESSAGE

@api_view(['DELETE'])
@permission_classes([IsAuthenticated , CanDeleteMessage , IsRoomMember])
def DelMessage(request , pkR , pkM):

    try:
        message = Message.objects.get(pk = pkM , room_id=pkR)
    except (Message.DoesNotExist , Room.DoesNotExist):
        return Response({"eorro" : "this message doesnt exist"})
    
    message.delete()
    return Response({"message deleted"})


# SEND FEEDBACK MESSAGE

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def SendFeedBack(request):
    serilaizer = FeedBack(data = request.data , context = {"request": request})
    if serilaizer.is_valid():
        serilaizer.save()
        return Response({"message" : "feedback sent"} , status=status.HTTP_201_CREATED)
    else:
        return Response(serilaizer.errors)
from django.shortcuts import render
from rest_framework.decorators import permission_classes , api_view
from rest_framework.permissions import AllowAny , IsAuthenticated
from .serializers import CreateRoom , Join_MS ,ViewRooms , RoomMod , Request_Join , JoinedRoomsSerializer
from rest_framework.response import Response 
from .models import MemberShip , Room , JoinRequest ,UserSnapshot
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from chat.permissions import IsRoomMember , CanManageRoom , IsNotRoomMember , IsNotOwner
from rest_framework import status
from django.views.decorators.cache import cache_page

# ALL ROOMS

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def AvailbleRooms(request):
    rooms = Room.objects.all()
    pagintaor = PageNumberPagination()
    pagintaor.page_size = 10
    queryset = pagintaor.paginate_queryset(rooms,request)
    serializer = ViewRooms(queryset , many=True , context={"request": request})
    return Response(serializer.data)


# CREATE ROOM

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def Createroom(request):
    serializer = CreateRoom(data = request.data , context={'request': request})

    if serializer.is_valid():
        serializer.save()
        return Response({"room created , have fun!"})
    return Response(serializer.errors)


# GET ROOM

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@cache_page(60 * 5)  # cache layer i guess
def GetRoom(request,pk):

    try:
        room = Room.objects.get(pk = pk)
    except Room.DoesNotExist:
        return Response({"error" : "this room DoesNotExist ya broo"}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = RoomMod(room)
    return Response(serializer.data)


# MDEIFY ROOM

@api_view(['PUT', 'DELETE' , 'PATCH'])
@permission_classes([IsAuthenticated , CanManageRoom])
def RoomModify(request,pk):

    try:
        room = Room.objects.get(pk = pk)
    except Room.DoesNotExist:
        return Response({"error" : "this room DoesNotExist ya broo"})
    
    if request.method == 'PATCH':
        serializer = RoomMod(room , data = request.data , partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors)
    
    elif request.method == 'DELETE':
        room.delete()
        return Response({"room deleted"})


# JOIN ROOM

@api_view(['POST'])
@permission_classes([IsAuthenticated , IsNotRoomMember])
def JoinRoom(request,pk):

    try:
        room = Room.objects.get(pk = pk)
    except Room.DoesNotExist:
        return Response({"error" : "this room DoesNotExist ya broo"})
    
    try:
        user_id = request.user.id
        user = UserSnapshot.objects.get(id=user_id)
    except UserSnapshot.DoesNotExist:
        return Response({"error" : "this user DoesNotExist ya broo"})

    if not room.private:
        Mes = MemberShip.objects.filter(user = user  , room = room).first() 
        if Mes:
            Mes.leftDate = None
            Mes.save()
            return Response({"joined":"you are now a member of this room , have fun!"})

        else:
            serializer = Join_MS( data = request.data , context={"request": request,"room" : room} )
            if serializer.is_valid():
                serializer.save()
                return Response({"joined":"you are now a member of this room , have fun!"})
            else :
                return Response(serializer.errors)
    else :
        joinRequest = JoinRequest.objects.filter(user = user , room = room , state = 'pending').first()
        if joinRequest:
            return Response({"message": "you already requested to join this room"})
        else :
            JoinRequest.objects.create(user = user , room = room)
            return Response({"message": "join request sent"})
    

# LEAVE ROOM 

@api_view(['POST'])
@permission_classes([IsAuthenticated , IsRoomMember , IsNotOwner])
def LeaveRoom(request , pk):

    try:
        room = Room.objects.get(pk = pk)
    except Room.DoesNotExist:
        return Response({"error" : "this room DoesNotExist ya broo"})
    
    user_id = request.user.id
    user = UserSnapshot.objects.filter(id=user_id).first()
    Mes = MemberShip.objects.filter(user = user  , room = room).first() 
    if Mes:
        Mes.leftDate = timezone.now()
        Mes.save()
        return Response({"message" : "you left this room"} , status=status.HTTP_200_OK)
    else:
        return Response({"message":"you are not a member of this room"} , status=status.HTTP_203_NON_AUTHORITATIVE_INFORMATION)


# GET pending REQS

@api_view(['GET'])
@permission_classes([IsAuthenticated , CanManageRoom])
def PendingRequests(request , pk):

    try:
        room = Room.objects.get(pk = pk)
    except Room.DoesNotExist:
        return Response({"error" : "this room DoesNotExist ya broo"})
    
    join_requests = JoinRequest.objects.filter(room=room, state='pending')
    serializer    = Request_Join(join_requests , many = True)
    return Response(serializer.data)


# OLD REQS

@api_view(['GET'])
@permission_classes([IsAuthenticated , CanManageRoom])
@cache_page(60 * 10)  # cache layer i guess
def OldRequests(request,pk):

    try:
        room = Room.objects.get(pk = pk)
    except Room.DoesNotExist:
        return Response({"error" : "this room DoesNotExist ya broo"})
    
    old_requests = JoinRequest.objects.filter(room=room, state__in = ['accepted' , 'rejected'])
    serializer = Request_Join(old_requests , many = True)
    return Response(serializer.data)

# ACCEPT OR REJECT REQ

@api_view(['PUT' , 'PATCH'])
@permission_classes([IsAuthenticated , CanManageRoom])
def RequestHandle(request , pk , pk_req):
    try:
        Jrequest = JoinRequest.objects.get(pk = pk_req)
    except (Room.DoesNotExist, JoinRequest.DoesNotExist):
        return Response({"error" : "this request or room DoesNotExist ya broo"})
    
    if Jrequest.state != 'pending':
        return Response({"error": "this request has already been handled"}, status=400)
    
    serializer = Request_Join(Jrequest , data = request.data , partial = True)
    if serializer.is_valid():
        serializer.save()
        reqState = serializer.instance.state
        Mes = MemberShip.objects.filter( user=Jrequest.user , room=Jrequest.room).first()
        if reqState == 'accepted':
            if Mes:
                Mes.leftDate = None
                Mes.save()
                return Response({"message" : "request accepted"})
            else:
                MemberShip.objects.create(user=Jrequest.user , room=Jrequest.room)
                return Response({"message" : "request accepted"})
            
        elif reqState == 'rejected':
            return Response({"message" : "request rejected"})
    else:
        return Response(serializer.errors)
    

# CANCEL REQUEST

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def DeleteRequest(request , pk):

    try:
        req = JoinRequest.objects.get(pk = pk)
    except JoinRequest.DoesNotExist():
        return Response({"message" : "this request Does Not Exist"} , status=status.HTTP_404_NOT_FOUND)
    
    if req.user != request.user:
        return Response({"error" : "you can't cancel this request"} , status=status.HTTP_401_UNAUTHORIZED)

    req.delete()
    return Response({"message" : "request canceled"} , status=status.HTTP_202_ACCEPTED)


# JOINED ROOMS (PROFILE)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def JoinedRooms(request):
    user_id = request.user.id
    user = UserSnapshot.objects.filter(id=user_id).first()
    rooms = MemberShip.objects.filter(user = user , leftDate = None)
    serializer = JoinedRoomsSerializer(rooms , many = True)
    return Response(serializer.data)


# PENDING REQUESTS (PROFILE)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def PendingRequestsProfile(request):
    user_id = request.user.id
    user = UserSnapshot.objects.filter(id=user_id).first()
    requests = JoinRequest.objects.filter(user = user , state= 'pending')
    serializer = Request_Join(requests , many = True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_cheack(request):
    return Response({"لا داعي للسيطرة الامور تحت القلق"})
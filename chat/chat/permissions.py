from rest_framework.permissions import BasePermission
from Rooms.models import Room, MemberShip
from Messages.models import Message
from Rooms.models import UserSnapshot

# MEMBER

class IsRoomMember(BasePermission):
    message = "You are not a member of this room."

    def has_permission(self, request, view):
        room_id = view.kwargs.get("pk") or view.kwargs.get("room_id") or view.kwargs.get("pkR")

        if not room_id:
            return False

        try:
            room = Room.objects.get(pk=room_id)
        except Room.DoesNotExist:
            return False
        
        user_id    = request.user.id
        user = UserSnapshot.objects.filter(id=user_id).first()

        return MemberShip.objects.filter(
            user             = user,
            room             = room,
            leftDate__isnull = True
        ).exists()

# عكس اللي فوقيها
class IsNotRoomMember(BasePermission):
    messafe = "you are alredy a member of this room"
    def has_permission(self, request, view):
        pk = view.kwargs.get('pk')
        try:
            room = Room.objects.get(pk=pk)
        except Room.DoesNotExist:
            return False

        user_id    = request.user.id
        user = UserSnapshot.objects.filter(id=user_id).first()

        return not MemberShip.objects.filter(
            user=user,
            room=room,
            leftDate=None
        ).exists()


# ROOM OWNER

class CanManageRoom(BasePermission):
    message = "You are not the owner of this room."

    def has_permission(self, request, view):
        room_id = view.kwargs.get("pk") or view.kwargs.get("room_id") or view.kwargs.get("pkR")

        if not room_id:
            return False

        try:
            room = Room.objects.get(pk=room_id)
        except Room.DoesNotExist:
            return False
        
        user_id    = request.user.id
        user = UserSnapshot.objects.filter(id=user_id).first()

        return MemberShip.objects.filter(
            user             = user,
            room             = room,
            role__in         = ['owner', 'admin'],
            leftDate__isnull = True
        ).exists()


# عكس اللي فوقها برضو

class IsNotOwner(BasePermission):
    message = "you are the owner of this room"
    def has_permission(self, request, view):
        room_id = view.kwargs.get("pk") or view.kwargs.get("room_id") or view.kwargs.get("pkR")

        if not room_id:
            return False

        try:
            room = Room.objects.get(pk=room_id)
        except Room.DoesNotExist:
            return False

        user_id    = request.user.id
        user = UserSnapshot.objects.filter(id=user_id).first()

        return not MemberShip.objects.filter(
            user             = user,
            room             = room,
            role             = 'owner',
            leftDate__isnull = True
        ).exists()


# MESSAGE OWNER

class IsMessageOwner(BasePermission):
    message = "You can't edite or delet this message."

    def has_permission(self, request, view):
        room_id = view.kwargs.get("pk") or view.kwargs.get("room_id") or view.kwargs.get("pkR")
        message_id = view.kwargs.get("pkM")

        if not room_id or not message_id:
            return False

        try:
            room = Room.objects.get(pk=room_id)
            message = Message.objects.get(pk=message_id)
        except (Room.DoesNotExist , Message.DoesNotExist):
            return False

        user_id    = request.user.id
        user = UserSnapshot.objects.filter(id=user_id).first()

        return Message.objects.filter(
            id      = message_id,
            user    = user,
            room    = room,
        ).exists()


# MESSAGE DELETION

class CanDeleteMessage(BasePermission):
    message = "You can't delete this message."

    def has_permission(self, request, view):
        room_id = view.kwargs.get("pkR") or view.kwargs.get("pk") or view.kwargs.get("room_id")
        message_id = view.kwargs.get("pkM") or view.kwargs.get("message_id")

        if not room_id or not message_id:
            return False

        message = Message.objects.filter(pk=message_id, room_id=room_id).first()
        if not message:
            return False

        if message.user_id == request.user.id:
            return True

        user_id    = request.user.id
        user = UserSnapshot.objects.filter(id=user_id).first()

        return MemberShip.objects.filter(
            user=user,
            room_id=room_id,
            role__in=['owner', 'admin'],
            leftDate__isnull=True
        ).exists()
from django.contrib import admin
from .models import Room , MemberShip , JoinRequest , UserSnapshot

admin.site.register(Room)
admin.site.register(MemberShip)
admin.site.register(JoinRequest)
admin.site.register(UserSnapshot)
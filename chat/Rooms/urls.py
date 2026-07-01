from django.urls import path 
from . import views


urlpatterns = [
    path('' , views.AvailbleRooms),
    path('create/' , views.Createroom),
    path('modify/<int:pk>/', views.RoomModify),
    path('join/<int:pk>/' , views.JoinRoom),
    path('leave/<int:pk>/' , views.LeaveRoom),
    path('room/<int:pk>/' , views.GetRoom),
    path('pendingrequsts/<int:pk>/' , views.PendingRequests),
    path('reqhandel/<int:pk>/<int:pk_req>/' , views.RequestHandle),
    path('oldrequsts/<int:pk>/' , views.OldRequests),
    path('cancelrequest/<int:pk>/' , views.DeleteRequest),
    path('joinedrooms/' , views.JoinedRooms),
    path('pendingrequsts/' , views.PendingRequestsProfile),
]

"""
    main apis for ROOMS

    ==> api/rooms/              (all rooms)
    ==> api/rooms/create/       (add room)
    ==> api/rooms/modify/       (modify room)
    ==> api/rooms/join/   (joinnnnnn)
"""
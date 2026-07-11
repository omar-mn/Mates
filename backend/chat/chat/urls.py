from django.contrib import admin
from django.urls import path , include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/rooms/' , include('Rooms.urls')),
    path('api/messages/' , include('Messages.urls')),
    path('', include('django_prometheus.urls')),
]

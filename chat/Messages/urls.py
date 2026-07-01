from django.urls import path 
from . import views

urlpatterns = [
    path('<int:pk>/' , views.Messages),
    path('send/<int:pk>/' , views.CreateMessage),
    path('mod/<int:pkR>/<int:pkM>/' , views.ModMessage),
    path('del/<int:pkR>/<int:pkM>/' , views.DelMessage),
    path('sendfeedback/' , views.SendFeedBack),
]

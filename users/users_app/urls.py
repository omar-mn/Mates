from django.urls import path , include
from . import views

urlpatterns = [
    # auth 
    path('', include('dj_rest_auth.urls')),
    path('registration/', include('dj_rest_auth.registration.urls')),
    path('profile/<int:pk>/' , views.GetProfile),
]


"""
    main apis for USERS

    ==> /auth/registration/         (new account)
    ==> /auth/login/                (login)
    ==> /auth/password/change/      (password)
    ==> /auth/password/reset/       (reset pass)
    ==> /auth/user/                 (user mod)
"""
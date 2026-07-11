from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
import jwt
from .settings import SECRET_KEY

SECRET_KEY = "django-insecure-=ls9@1pcm=5pk_q%aud7%+51h*a+6!@!v#x4l+gyw4jl$ldsys"


class AuthUser:
    def __init__(self, user_id):
        self.id = user_id
        self.is_authenticated = True

    def __str__(self):
        return str(self.id)


class JWTAuthentication(BaseAuthentication):

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return None

        try:
            prefix, token = auth_header.split()
            if prefix.lower() != "bearer":
                raise AuthenticationFailed("Invalid token prefix")

            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token expired")
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("Invalid token")
        
        user_id = payload.get("user_id")
        if not user_id:
            raise AuthenticationFailed("Invalid payload")

        return (AuthUser(user_id), None)
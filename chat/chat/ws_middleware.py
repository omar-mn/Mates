from channels.db import database_sync_to_async
from Rooms.models import UserSnapshot
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken

@database_sync_to_async
def get_user(user_id):
    try:
        return UserSnapshot.objects.get(id=user_id)
    except UserSnapshot.DoesNotExist:
        return AnonymousUser()

class jwtAuth:

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        try:
            query_string = scope.get('query_string', b'').decode()
            token = query_string.split('=')[-1].strip()
            untuned_token = AccessToken(token)
            user_id = untuned_token['user_id'] 
            scope['user'] = await get_user(user_id)
            
        except Exception as e:
            print(f"SimpleJWT Error: {e}")
            scope['user'] = AnonymousUser()

        return await self.app(scope, receive, send)
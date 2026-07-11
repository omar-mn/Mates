from django.db import models
from django_prometheus.models import ExportModelOperationsMixin

def getroomImageFilepath(self,filename):
    return f'rooms/roomImages/{self.pk}/{"profileImage.png"}'

def getroombannerFilepath(self,filename):
    return f'rooms/roomBanners/{self.pk}/{"profileImage.png"}'


class UserSnapshot(ExportModelOperationsMixin('UserSnapshot'), models.Model):
    username            = models.CharField(max_length=100)
    avatar_url          = models.URLField(null=True, blank=True)
    updated_at          = models.DateTimeField(auto_now=True)


class Room(ExportModelOperationsMixin('Room'), models.Model):
    
    class CategoryChoices(models.TextChoices):
        STUDY           = 'study'
        GAMES           = 'games'
        PROGRAMMING     = 'programing'
        LIFEISSUES      = 'life issues'
        OTHER           = 'other'

    name                = models.CharField(max_length=50)
    private             = models.BooleanField(default=False)
    description         = models.TextField(max_length=500 , blank=True , null=True , default="a Mates Room, join us!!")
    created_date        = models.DateTimeField(auto_now_add=True)
    user                = models.ManyToManyField(UserSnapshot , through='MemberShip')
    category            = models.CharField(choices=CategoryChoices.choices , default=CategoryChoices.OTHER , max_length=20)
    owner               = models.ForeignKey(UserSnapshot, on_delete=models.CASCADE, related_name="owned_rooms")
    room_image          = models.ImageField(upload_to=getroomImageFilepath,max_length=255 , null=True , blank=True , default='main.png')
    room_banner         = models.ImageField(upload_to=getroombannerFilepath,max_length=255 , null=True , blank=True , default='main.png')

    def __str__(self):
        return self.name


class MemberShip(ExportModelOperationsMixin('MemberShip'), models.Model):

    class Role(models.TextChoices):
        ADMIN           = 'admin'
        OWNER           = 'owner'
        MEMBER          = 'member'

    class Meta:
        constraints = [
        models.UniqueConstraint(fields=["user", "room"], name="unique_room_member")
    ]

    user                = models.ForeignKey(UserSnapshot ,on_delete=models.CASCADE)
    room                = models.ForeignKey(Room , on_delete=models.CASCADE)
    joinDate            = models.DateTimeField(auto_now_add=True)
    leftDate            = models.DateTimeField(null=True, blank=True)
    role                = models.CharField(choices=Role.choices , default=Role.MEMBER , max_length=20)

    def __str__(self):
        return self.user.username + ' ' + self.role


class JoinRequest(ExportModelOperationsMixin('JoinRequest'), models.Model):
    class reqState(models.TextChoices):
        PENDING     = 'pending'
        REJECTED    = 'rejected'
        ACCEPTED    = 'accepted'
        NULL        = 'null'

    user                = models.ForeignKey(UserSnapshot ,on_delete=models.CASCADE)
    room                = models.ForeignKey(Room , on_delete=models.CASCADE)
    state               = models.CharField(choices=reqState.choices , default='pending' , max_length=20)

    def __str__(self):
        return self.user.username + ' ' + self.state
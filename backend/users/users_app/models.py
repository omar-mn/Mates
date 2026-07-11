from django.db import models
from django.contrib.auth.models import  AbstractBaseUser , BaseUserManager
from django.db import transaction
from django.utils import timezone
from django_prometheus.models import ExportModelOperationsMixin


# SUPER USER
class UserManager(BaseUserManager):
    
    def create_user(self , email , username , password=None):
        if not email:
            raise ValueError("الايميل فين يخويا")
        if not username:
            raise ValueError("اليوزر فين يخويا")
        
        user = self.model(
            email = self.normalize_email(email),
            username = username,
        ) 
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self , email , username , password):
        user = self.create_user(
            email=self.normalize_email(email),
            username=username,
            password=password,
        )
        user.is_admin        = True
        user.is_staff        = True
        user.is_superuser    = True
        user.is_active       = True
        user.save(using=self._db)
        return user


#image get
def getProfileImageFilepath(self,filename):
    return f'users/profileImages/{self.pk}/{"profileImage.png"}'

def getProfileBannerFilepath(self,filename):
    return f'users/profileBanner/{self.pk}/{"profileImage.png"}'


# REG USER

class account(ExportModelOperationsMixin('account'), AbstractBaseUser):
    
    #main-fields
    email                    = models.EmailField(max_length=60 , unique=True , blank=False , null=False)
    username                 = models.CharField( max_length=20 , unique=True , blank=False , null=False)
    first_name               = models.CharField(max_length=20 , null=True , blank=True)
    last_name                = models.CharField(max_length=20 , null=True , blank=True)

    #extra-fields
    profileImage             = models.ImageField(upload_to=getProfileImageFilepath,max_length=255 , null=True , blank=True , default='main.png')
    profile_banner           = models.ImageField(upload_to=getProfileBannerFilepath,max_length=255 , null=True , blank=True , default='main2.png')
    bio                      = models.CharField(max_length=500 , null=True , blank=True , default="hmmmmmmmmmmmmmmmmmm............")

    #other-fields
    is_active                = models.BooleanField(default=True)
    is_admin                 = models.BooleanField(default=False)
    is_superuser             = models.BooleanField(default=False)
    is_staff                 = models.BooleanField(default=False)
    dateJoined               = models.DateTimeField(auto_now_add=True)
    lastLogin                = models.DateTimeField(auto_now=True)
    hideEmail                = models.BooleanField(default=True)
    objects                  = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def getProfileImageFilename(self):
        return str(self.profileImage)[str(self.profileImage).index(f'profileImages/{self.pk}/'):]

    def __str__(self):
        return self.username

    def has_perm(self , perm , obj=None):
        return self.is_admin
    
    def has_module_perms(self , app_label):
        return True
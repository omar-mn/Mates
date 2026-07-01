from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from users_app.models import account

class AdminUser(UserAdmin):
    list_display        = ('email' , 'username' , 'dateJoined' , 'lastLogin' , 'is_admin' , 'is_staff')
    search_fields       = ('email' , 'username')
    readonly_fields     = ('id' , 'lastLogin' , 'dateJoined')
    filter_horizontal   = ()
    list_filter         = ()
    fieldsets           = ()
admin.site.register(account,AdminUser)
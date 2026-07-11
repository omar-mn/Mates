from django.db import models

class Message(models.Model):
    content             = models.TextField(max_length=10000)
    user                = models.ForeignKey('Rooms.UserSnapshot' , on_delete=models.CASCADE)
    room                = models.ForeignKey('Rooms.Room' , on_delete=models.CASCADE)
    sent_at             = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ' {self.content} '"
    
class FeedBackMessage(models.Model):
    content             = models.TextField(max_length=10000)
    user                = models.ForeignKey('Rooms.UserSnapshot' , on_delete=models.CASCADE)
    sent_at             = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ' {self.content} '"
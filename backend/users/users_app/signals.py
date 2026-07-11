from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import account
from .tasks import publish_user_upserted
from django.db import transaction


@receiver(post_save, sender=account)
def on_account_saved(sender, instance, created, **kwargs):
    transaction.on_commit(lambda: publish_user_upserted.delay(
        instance.id,
        instance.username,
        instance.profileImage.url if instance.profileImage else None
    ))
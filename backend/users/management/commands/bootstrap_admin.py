from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Creates the FinWise-AI admin account from ADMIN_EMAIL/ADMIN_USERNAME/ADMIN_PASSWORD if it doesn't exist."

    def handle(self, *args, **options):
        email = settings.ADMIN_EMAIL
        username = settings.ADMIN_USERNAME
        password = settings.ADMIN_PASSWORD

        if User.objects.filter(email__iexact=email).exists():
            self.stdout.write(self.style.WARNING(f"Admin account already exists: {email}"))
            return

        User.objects.create_superuser(
            username=username, email=email, password=password, role=User.Role.ADMIN,
        )
        self.stdout.write(self.style.SUCCESS(f"Admin account created: {email} (username: {username})"))

import pytest
from unittest.mock import patch
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import account

User = account

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def mock_celery_task():
    """Prevent Celery tasks triggered by post_save signals from running during tests."""
    with patch("celery.app.task.Task.delay") as mocked_delay:
        yield mocked_delay


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def password():
    return "StrongPassw0rd!123"


@pytest.fixture
def user(password):
    return User.objects.create_user(
        email="existinguser@example.com",
        username="existinguser",
        password=password,
    )


@pytest.fixture
def auth_client(api_client, user, password):
    response = api_client.post(
        "/api/auth/login/",
        {"email": user.email, "password": password},
        format="json",
    )
    assert response.status_code == status.HTTP_200_OK
    token = response.data.get("access") or response.data.get("key")
    if token:
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return api_client


def test_healthcheck_returns_200(api_client):
    response = api_client.get("/api/auth/test/")
    assert response.status_code == status.HTTP_200_OK


def test_registration_success(api_client):
    payload = {
        "email": "newuser@example.com",
        "username": "newuser",
        "password1": "StrongPassw0rd!123",
        "password2": "StrongPassw0rd!123",
    }
    response = api_client.post("/api/auth/registration/", payload, format="json")
    assert response.status_code in (status.HTTP_200_OK, status.HTTP_201_CREATED)
    assert User.objects.filter(email="newuser@example.com").exists()


def test_login_success(api_client, user, password):
    response = api_client.post(
        "/api/auth/login/",
        {"email": user.email, "password": password},
        format="json",
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.data.get("access") or response.data.get("key")


def test_user_endpoint_returns_own_data(auth_client, user):
    response = auth_client.get("/api/auth/user/")
    assert response.status_code == status.HTTP_200_OK
    assert response.data.get("email") == user.email


def test_profile_endpoint_authenticated_existing_profile(auth_client, user):
    response = auth_client.get(f"/api/auth/profile/{user.pk}/")
    assert response.status_code == status.HTTP_200_OK


def test_profile_endpoint_unauthenticated_returns_401_or_403(api_client, user):
    response = api_client.get(f"/api/auth/profile/{user.pk}/")
    assert response.status_code in (
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_403_FORBIDDEN,
    )


def test_profile_endpoint_nonexistent_returns_404(auth_client):
    non_existent_pk = 999999
    response = auth_client.get(f"/api/auth/profile/{non_existent_pk}/")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_password_change_success(auth_client, password):
    new_password = "AnotherStrongPass1!"
    payload = {
        "old_password": password,
        "new_password1": new_password,
        "new_password2": new_password,
    }
    response = auth_client.post("/api/auth/password/change/", payload, format="json")
    assert response.status_code == status.HTTP_200_OK
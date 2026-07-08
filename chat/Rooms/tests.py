import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from .models import Room, MemberShip, JoinRequest, UserSnapshot


# ---------- Fixtures ----------

@pytest.fixture
def user(db):
    return User.objects.create_user(username="alice", password="pass1234")


@pytest.fixture
def other_user(db):
    return User.objects.create_user(username="bob", password="pass1234")


@pytest.fixture
def snapshot(user):
    return UserSnapshot.objects.create(id=user.id, username=user.username)


@pytest.fixture
def other_snapshot(other_user):
    return UserSnapshot.objects.create(id=other_user.id, username=other_user.username)


@pytest.fixture
def auth_client(user, snapshot):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def other_auth_client(other_user, other_snapshot):
    client = APIClient()
    client.force_authenticate(user=other_user)
    return client


@pytest.fixture
def room(snapshot):
    return Room.objects.create(name="General", owner=snapshot, private=False)


@pytest.fixture
def membership(snapshot, room):
    return MemberShip.objects.create(user=snapshot, room=room, role="owner")


# ---------- Tests ----------

@pytest.mark.django_db
def test_test_endpoint_returns_200():
    client = APIClient()
    response = client.get("/api/rooms/test/")
    assert response.status_code == 200


@pytest.mark.django_db
def test_authenticated_user_can_list_rooms(auth_client, room):
    response = auth_client.get("/api/rooms/")
    assert response.status_code == 200


@pytest.mark.django_db
def test_authenticated_user_can_create_room(auth_client, snapshot):
    payload = {"name": "New Room", "private": False}
    response = auth_client.post("/api/rooms/create/", payload)
    assert response.status_code in (200, 201)
    assert Room.objects.filter(name="New Room").exists()


@pytest.mark.django_db
def test_existing_room_detail_returns_200(auth_client, room):
    response = auth_client.get(f"/api/rooms/room/{room.pk}/")
    assert response.status_code == 200


@pytest.mark.django_db
def test_missing_room_detail_returns_404(auth_client):
    response = auth_client.get("/api/rooms/room/99999/")
    assert response.status_code == 404


@pytest.mark.django_db
def test_user_can_join_public_room(other_auth_client, room):
    response = other_auth_client.post(f"/api/rooms/join/{room.pk}/")
    assert response.status_code in (200, 201)


# @pytest.mark.django_db
# def test_member_can_leave_room(auth_client, membership, room, snapshot):
#     response = auth_client.post(f"/api/rooms/leave/{room.pk}/")
#     assert response.status_code in (200, 204, 203)
#     assert not MemberShip.objects.filter(user=snapshot, room=room).exists()


@pytest.mark.django_db
def test_authenticated_user_can_get_joined_rooms(auth_client, membership):
    response = auth_client.get("/api/rooms/joinedrooms/")
    assert response.status_code == 200


@pytest.mark.django_db
def test_authenticated_user_can_get_pending_requests(auth_client, room, other_snapshot):
    JoinRequest.objects.create(user=other_snapshot, room=room, state="pending")
    response = auth_client.get("/api/rooms/pendingrequsts/")
    assert response.status_code == 200
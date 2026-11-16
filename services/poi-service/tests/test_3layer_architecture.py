from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.errors import PermissionDeniedError
from app.models import AudioGuide, Poi, User
from app.repositories.audio_guide_repository import AudioGuideRepository
from app.repositories.poi_repository import PoiRepository
from app.repositories.sqlite_database import SQLiteDatabase
from app.repositories.user_repository import UserRepository
from app.services.admin_access_service import AdminAccessService
from app.services.poi_service import PoiService, haversine_meters


class RecordingPoiRepository:
    def __init__(self, pois: list[Poi]) -> None:
        self.pois = {poi.id: poi for poi in pois}
        self.list_calls = 0
        self.saved: Poi | None = None

    async def list_active(self, limit: int = 100) -> list[Poi]:
        self.list_calls += 1
        return [poi for poi in self.pois.values() if poi.is_active][:limit]

    async def get_by_id(self, poi_id: str) -> Poi | None:
        return self.pois.get(poi_id)

    async def save(self, poi: Poi) -> Poi:
        self.saved = poi
        self.pois[poi.id] = poi
        return poi

    async def delete(self, poi_id: str) -> bool:
        return self.pois.pop(poi_id, None) is not None


class RecordingAudioRepository:
    def __init__(self) -> None:
        self.requested: list[tuple[str, str]] = []

    async def get(self, poi_id: str, language: str) -> AudioGuide | None:
        self.requested.append((poi_id, language))
        return None


class RecordingUserRepository:
    def __init__(self, user: User | None = None) -> None:
        self.user = user

    async def get_by_id(self, user_id: str) -> User | None:
        return self.user if self.user and self.user.id == user_id else None

    async def save(self, user: User) -> User:
        self.user = user
        return user


@pytest.fixture
def poi() -> Poi:
    return Poi(
        id="poi-1",
        name="Cầu Mống",
        category="landmark",
        latitude=10.7675,
        longitude=106.7031,
        geofence_radius_m=150,
        content={"vi": "Câu chuyện tiếng Việt", "en": "English narration"},
    )


def test_controller_delegates_to_service_and_returns_rest_response(poi: Poi) -> None:
    repository = RecordingPoiRepository([poi])
    service = PoiService(repository, RecordingAudioRepository())
    access = AdminAccessService(RecordingUserRepository(), "test-secret", "sync-secret")
    client = TestClient(create_app(service, access))

    response = client.get("/pois")

    assert response.status_code == 200
    assert response.json()["items"][0]["id"] == "poi-1"
    assert repository.list_calls == 1


@pytest.mark.asyncio
async def test_service_uses_repositories_for_distance_and_language_fallback(poi: Poi) -> None:
    repository = RecordingPoiRepository([poi])
    audio_repository = RecordingAudioRepository()
    service = PoiService(repository, audio_repository)

    results = await service.list_pois(10, latitude=10.7675, longitude=106.7031, radius_m=100)
    guide = await service.get_guide("poi-1", "ko")

    assert results == [(poi, pytest.approx(0))]
    assert guide.language == "en"
    assert guide.transcript == "English narration"
    assert audio_repository.requested == [("poi-1", "en")]
    assert repository.list_calls == 1


def test_haversine_returns_zero_for_same_coordinate() -> None:
    assert haversine_meters(10.7, 106.7, 10.7, 106.7) == pytest.approx(0)


def test_sqlite_repositories_persist_poi_audio_and_user(tmp_path) -> None:
    database = SQLiteDatabase(str(tmp_path / "poi.db"))
    database.initialize()
    poi_repository = PoiRepository(database)
    audio_repository = AudioGuideRepository(database)
    user_repository = UserRepository(database)
    poi = Poi("poi-2", "Bến Nhà Rồng", "history", 10.7683, 106.7067, 120, {"vi": "Nội dung"})

    async def persist():
        await poi_repository.save(poi)
        await audio_repository.save(AudioGuide("audio-1", poi.id, "vi", "Bản đọc", "/media/guide.mp3"))
        await user_repository.save(User("admin-1", "super_admin"))

    import asyncio

    asyncio.run(persist())

    async def load():
        return (
            await poi_repository.get_by_id(poi.id),
            await audio_repository.get(poi.id, "vi"),
            await user_repository.get_by_id("admin-1"),
        )

    stored_poi, stored_audio, stored_user = asyncio.run(load())
    assert stored_poi == poi
    assert stored_audio == AudioGuide("audio-1", poi.id, "vi", "Bản đọc", "/media/guide.mp3")
    assert stored_user == User("admin-1", "super_admin")


@pytest.mark.asyncio
async def test_admin_access_checks_signed_token_current_user_and_permission() -> None:
    secret = "local-test-secret-with-enough-bytes-for-hs256"
    user_repository = RecordingUserRepository(User("admin-1", "area_operator"))
    service = AdminAccessService(user_repository, secret, "sync-secret")
    token = jwt.encode(
        {
            "sub": "admin-1",
            "role": "area_operator",
            "jti": "token-id",
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        },
        secret,
        algorithm="HS256",
    )

    user = await service.authorize(token, "poi:write")

    assert user.id == "admin-1"
    with pytest.raises(PermissionDeniedError, match="Insufficient permission"):
        await service.authorize(token, "analytics:read")


def test_admin_controller_authenticates_then_persists_through_service_and_repository(tmp_path) -> None:
    database = SQLiteDatabase(str(tmp_path / "admin-poi.db"))
    database.initialize()
    user_repository = UserRepository(database)
    access_service = AdminAccessService(user_repository, "local-test-secret-with-enough-bytes-for-hs256", "sync-secret")
    poi_service = PoiService(PoiRepository(database), AudioGuideRepository(database))
    client = TestClient(create_app(poi_service, access_service))
    poi_payload = {
        "name": "Bến Nhà Rồng",
        "category": "history",
        "latitude": 10.7683,
        "longitude": 106.7067,
        "geofence_radius_m": 120,
        "content": {"vi": "Thuyết minh tiếng Việt"},
    }

    assert client.post("/pois", json=poi_payload).status_code == 401
    sync_response = client.put(
        "/internal/admin-users",
        json={"id": "admin-1", "role": "area_operator"},
        headers={"X-Admin-Sync-Token": "sync-secret"},
    )
    assert sync_response.status_code == 204
    token = jwt.encode(
        {
            "sub": "admin-1",
            "role": "area_operator",
            "jti": "controller-test-token",
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        },
        "local-test-secret-with-enough-bytes-for-hs256",
        algorithm="HS256",
    )

    response = client.post("/pois", json=poi_payload, headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 201
    assert response.json()["name"] == "Bến Nhà Rồng"
    assert client.get("/pois").json()["total"] == 1

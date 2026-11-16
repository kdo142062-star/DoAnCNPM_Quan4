import math
import secrets
from dataclasses import replace

from app.errors import InvalidInputError, PoiNotFoundError
from app.models import AudioGuide, Poi, ResolvedGuide
from app.repositories.audio_guide_repository import AudioGuideRepository
from app.repositories.poi_repository import PoiRepository

EARTH_RADIUS_METERS = 6_371_008.8
SUPPORTED_LANGUAGES = frozenset({"vi", "en", "zh", "ko", "ja"})


def haversine_meters(latitude: float, longitude: float, other_latitude: float, other_longitude: float) -> float:
    latitude_radians = math.radians(latitude)
    other_latitude_radians = math.radians(other_latitude)
    delta_latitude = other_latitude_radians - latitude_radians
    delta_longitude = math.radians(other_longitude - longitude)
    value = (
        math.sin(delta_latitude / 2) ** 2
        + math.cos(latitude_radians)
        * math.cos(other_latitude_radians)
        * math.sin(delta_longitude / 2) ** 2
    )
    return EARTH_RADIUS_METERS * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))


class PoiService:
    def __init__(self, poi_repository: PoiRepository, audio_repository: AudioGuideRepository) -> None:
        self.poi_repository = poi_repository
        self.audio_repository = audio_repository

    async def list_pois(
        self,
        limit: int,
        latitude: float | None = None,
        longitude: float | None = None,
        radius_m: int | None = None,
    ) -> list[tuple[Poi, float | None]]:
        supplied = (latitude is not None, longitude is not None, radius_m is not None)
        if any(supplied) and not all(supplied):
            raise InvalidInputError("latitude, longitude and radius_m must be provided together")
        items = await self.poi_repository.list_active(limit=100 if radius_m is not None else limit)
        if radius_m is None or latitude is None or longitude is None:
            return [(poi, None) for poi in items[:limit]]

        measured = [
            (
                poi,
                haversine_meters(latitude, longitude, poi.latitude, poi.longitude),
            )
            for poi in items
        ]
        nearby = [(poi, distance) for poi, distance in measured if distance <= radius_m]
        nearby.sort(key=lambda result: result[1])
        return nearby[:limit]

    async def get_poi(self, poi_id: str) -> Poi:
        poi = await self.poi_repository.get_by_id(poi_id)
        if poi is None or not poi.is_active:
            raise PoiNotFoundError("POI not found")
        return poi

    async def create_poi(
        self,
        *,
        name: str,
        category: str,
        latitude: float,
        longitude: float,
        geofence_radius_m: int,
        content: dict[str, str],
    ) -> Poi:
        if not content.get("vi", "").strip():
            raise InvalidInputError("Vietnamese content is required")
        unsupported = set(content) - SUPPORTED_LANGUAGES
        if unsupported:
            raise InvalidInputError(f"Unsupported languages: {', '.join(sorted(unsupported))}")
        poi = Poi(
            id=secrets.token_hex(12),
            name=name.strip(),
            category=category.strip(),
            latitude=latitude,
            longitude=longitude,
            geofence_radius_m=geofence_radius_m,
            content=content,
        )
        return await self.poi_repository.save(poi)

    async def update_poi(self, poi_id: str, values: dict[str, object]) -> Poi:
        current = await self.get_poi(poi_id)
        updates = {key: value for key, value in values.items() if value is not None}
        if len(updates) != len(values):
            raise InvalidInputError("Fields cannot be null")
        if not updates:
            raise InvalidInputError("At least one field must be provided")
        content = updates.get("content")
        if content is not None:
            if not isinstance(content, dict) or not content.get("vi", "").strip():
                raise InvalidInputError("Vietnamese content is required")
            unsupported = set(content) - SUPPORTED_LANGUAGES
            if unsupported:
                raise InvalidInputError(f"Unsupported languages: {', '.join(sorted(unsupported))}")
        return await self.poi_repository.save(replace(current, **updates))

    async def delete_poi(self, poi_id: str) -> None:
        await self.get_poi(poi_id)
        if not await self.poi_repository.delete(poi_id):
            raise PoiNotFoundError("POI not found")

    async def get_guide(self, poi_id: str, requested_language: str) -> ResolvedGuide:
        if requested_language not in SUPPORTED_LANGUAGES:
            raise InvalidInputError("Unsupported language")
        poi = await self.get_poi(poi_id)
        language = next(
            (candidate for candidate in (requested_language, "en", "vi") if candidate in poi.content),
            None,
        )
        if language is None:
            raise PoiNotFoundError("POI has no published narration")
        stored_guide = await self.audio_repository.get(poi.id, language)
        return ResolvedGuide(
            poi=poi,
            language=language,
            transcript=stored_guide.transcript if stored_guide else poi.content[language],
            audio_url=stored_guide.audio_url if stored_guide else None,
        )

    async def activate_nearest_guide(
        self,
        latitude: float,
        longitude: float,
        requested_language: str,
    ) -> ResolvedGuide | None:
        if requested_language not in SUPPORTED_LANGUAGES:
            raise InvalidInputError("Unsupported language")
        candidates = await self.poi_repository.list_active()
        eligible = [
            (
                poi,
                haversine_meters(latitude, longitude, poi.latitude, poi.longitude),
            )
            for poi in candidates
            if poi.is_active
        ]
        within_geofence = [
            (poi, distance)
            for poi, distance in eligible
            if distance <= poi.geofence_radius_m
        ]
        if not within_geofence:
            return None
        poi, distance = min(within_geofence, key=lambda result: result[1])
        guide = await self.get_guide(poi.id, requested_language)
        return replace(guide, distance_m=distance)

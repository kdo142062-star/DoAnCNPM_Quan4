from dataclasses import dataclass, field


@dataclass(frozen=True)
class Poi:
    id: str
    name: str
    category: str
    latitude: float
    longitude: float
    geofence_radius_m: int
    content: dict[str, str] = field(default_factory=dict)
    is_active: bool = True


@dataclass(frozen=True)
class AudioGuide:
    id: str
    poi_id: str
    language: str
    transcript: str
    audio_url: str | None = None


@dataclass(frozen=True)
class User:
    id: str
    role: str
    is_active: bool = True


@dataclass(frozen=True)
class ResolvedGuide:
    poi: Poi
    language: str
    transcript: str
    audio_url: str | None
    distance_m: float | None = None

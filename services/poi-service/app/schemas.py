from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, model_validator

LanguageCode = Annotated[str, Field(pattern="^(vi|en|zh|ko|ja)$")]
Narration = Annotated[str, Field(min_length=1, max_length=50_000)]


class PoiCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Annotated[str, Field(min_length=1, max_length=200)]
    category: Annotated[str, Field(min_length=1, max_length=100)]
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    geofence_radius_m: int = Field(default=100, ge=10, le=1000)
    content: dict[LanguageCode, Narration]

    @model_validator(mode="after")
    def require_vietnamese(self) -> "PoiCreateRequest":
        if not self.content.get("vi", "").strip():
            raise ValueError("Vietnamese content is required")
        return self


class PoiUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Annotated[str, Field(min_length=1, max_length=200)] | None = None
    category: Annotated[str, Field(min_length=1, max_length=100)] | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    geofence_radius_m: int | None = Field(default=None, ge=10, le=1000)
    content: dict[LanguageCode, Narration] | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def validate_changes(self) -> "PoiUpdateRequest":
        if any(getattr(self, field) is None for field in self.model_fields_set):
            raise ValueError("Fields cannot be null")
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be provided together")
        return self


class PoiResponse(BaseModel):
    id: str
    name: str
    category: str
    latitude: float
    longitude: float
    geofence_radius_m: int
    content: dict[str, str]
    is_active: bool
    distance_m: float | None = None


class PoiListResponse(BaseModel):
    items: list[PoiResponse]
    total: int


class GuideResponse(BaseModel):
    poi_id: str
    poi_name: str
    language: str
    transcript: str
    audio_url: str | None
    distance_m: float | None = None


class GeofenceRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    language: LanguageCode = "vi"


class AdminUserSyncRequest(BaseModel):
    id: Annotated[str, Field(min_length=1, max_length=128)]
    role: Annotated[str, Field(pattern="^(super_admin|area_operator|content_editor|analytics_viewer)$")]
    is_active: bool = True


class HealthResponse(BaseModel):
    status: str
    service: str

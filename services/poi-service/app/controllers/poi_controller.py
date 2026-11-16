from collections.abc import Callable

from fastapi import APIRouter, Cookie, Depends, FastAPI, Header, Query, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.errors import AuthenticationRequiredError, InvalidInputError, PermissionDeniedError, PoiNotFoundError
from app.models import Poi, ResolvedGuide, User
from app.schemas import (
    AdminUserSyncRequest,
    GeofenceRequest,
    GuideResponse,
    PoiCreateRequest,
    PoiListResponse,
    PoiResponse,
    PoiUpdateRequest,
)
from app.services.admin_access_service import AdminAccessService
from app.services.poi_service import PoiService

router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)


def get_poi_service(request: Request) -> PoiService:
    return request.app.state.poi_service


def get_admin_access_service(request: Request) -> AdminAccessService:
    return request.app.state.admin_access_service


def require_permission(permission: str) -> Callable[..., User]:
    async def guard(
        request: Request,
        credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
        admin_session: str | None = Cookie(default=None, alias="admin_session"),
        access_service: AdminAccessService = Depends(get_admin_access_service),
    ) -> User:
        token = credentials.credentials if credentials else admin_session
        if not token:
            raise AuthenticationRequiredError("Authentication required")
        return await access_service.authorize(token, permission)

    return guard


def to_poi_response(poi: Poi, distance_m: float | None = None) -> PoiResponse:
    return PoiResponse(
        id=poi.id,
        name=poi.name,
        category=poi.category,
        latitude=poi.latitude,
        longitude=poi.longitude,
        geofence_radius_m=poi.geofence_radius_m,
        content=poi.content,
        is_active=poi.is_active,
        distance_m=distance_m,
    )


def to_guide_response(guide: ResolvedGuide) -> GuideResponse:
    return GuideResponse(
        poi_id=guide.poi.id,
        poi_name=guide.poi.name,
        language=guide.language,
        transcript=guide.transcript,
        audio_url=guide.audio_url,
        distance_m=guide.distance_m,
    )


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "poi-service"}


@router.get("/pois", response_model=PoiListResponse)
async def list_pois(
    service: PoiService = Depends(get_poi_service),
    limit: int = Query(default=50, ge=1, le=100),
    latitude: float | None = Query(default=None, ge=-90, le=90),
    longitude: float | None = Query(default=None, ge=-180, le=180),
    radius_m: int | None = Query(default=None, gt=0, le=100_000),
) -> PoiListResponse:
    results = await service.list_pois(limit, latitude, longitude, radius_m)
    return PoiListResponse(
        items=[to_poi_response(poi, distance) for poi, distance in results],
        total=len(results),
    )


@router.get("/pois/{poi_id}", response_model=PoiResponse)
async def get_poi(poi_id: str, service: PoiService = Depends(get_poi_service)) -> PoiResponse:
    return to_poi_response(await service.get_poi(poi_id))


@router.get("/pois/{poi_id}/guide", response_model=GuideResponse)
async def get_guide(
    poi_id: str,
    language: str = Query(default="vi", pattern="^(vi|en|zh|ko|ja)$"),
    service: PoiService = Depends(get_poi_service),
) -> GuideResponse:
    return to_guide_response(await service.get_guide(poi_id, language))


@router.post("/pois/geofence", response_model=GuideResponse | None)
async def activate_geofence(
    payload: GeofenceRequest,
    service: PoiService = Depends(get_poi_service),
) -> GuideResponse | None:
    guide = await service.activate_nearest_guide(payload.latitude, payload.longitude, payload.language)
    return to_guide_response(guide) if guide else None


@router.post("/pois", response_model=PoiResponse, status_code=status.HTTP_201_CREATED)
async def create_poi(
    payload: PoiCreateRequest,
    service: PoiService = Depends(get_poi_service),
    _: User = Depends(require_permission("poi:write")),
) -> PoiResponse:
    poi = await service.create_poi(**payload.model_dump())
    return to_poi_response(poi)


@router.put("/pois/{poi_id}", response_model=PoiResponse)
async def update_poi(
    poi_id: str,
    payload: PoiUpdateRequest,
    service: PoiService = Depends(get_poi_service),
    _: User = Depends(require_permission("poi:write")),
) -> PoiResponse:
    poi = await service.update_poi(poi_id, payload.model_dump(exclude_unset=True))
    return to_poi_response(poi)


@router.delete("/pois/{poi_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_poi(
    poi_id: str,
    service: PoiService = Depends(get_poi_service),
    _: User = Depends(require_permission("poi:write")),
) -> Response:
    await service.delete_poi(poi_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/internal/admin-users", status_code=status.HTTP_204_NO_CONTENT)
async def sync_admin_user(
    payload: AdminUserSyncRequest,
    access_service: AdminAccessService = Depends(get_admin_access_service),
    sync_token: str | None = Header(default=None, alias="X-Admin-Sync-Token"),
) -> Response:
    await access_service.sync_user(User(**payload.model_dump()), sync_token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def install_exception_handlers(application: FastAPI) -> None:
    @application.exception_handler(PoiNotFoundError)
    async def handle_not_found(_, error: PoiNotFoundError) -> Response:
        return _json_error(status.HTTP_404_NOT_FOUND, str(error))

    @application.exception_handler(InvalidInputError)
    async def handle_invalid_input(_, error: InvalidInputError) -> Response:
        return _json_error(status.HTTP_422_UNPROCESSABLE_ENTITY, str(error))

    @application.exception_handler(AuthenticationRequiredError)
    async def handle_unauthorized(_, error: AuthenticationRequiredError) -> Response:
        return _json_error(status.HTTP_401_UNAUTHORIZED, str(error), {"WWW-Authenticate": "Bearer"})

    @application.exception_handler(PermissionDeniedError)
    async def handle_forbidden(_, error: PermissionDeniedError) -> Response:
        return _json_error(status.HTTP_403_FORBIDDEN, str(error))


def _json_error(status_code: int, detail: str, headers: dict[str, str] | None = None) -> Response:
    from fastapi.responses import JSONResponse

    return JSONResponse(status_code=status_code, content={"detail": detail}, headers=headers)

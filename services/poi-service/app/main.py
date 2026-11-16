import os

from fastapi import FastAPI

from app.controllers.poi_controller import install_exception_handlers, router
from app.repositories.audio_guide_repository import AudioGuideRepository
from app.repositories.poi_repository import PoiRepository
from app.repositories.sqlite_database import SQLiteDatabase
from app.repositories.user_repository import UserRepository
from app.services.admin_access_service import AdminAccessService
from app.services.poi_service import PoiService


def create_app(
    poi_service: PoiService | None = None,
    admin_access_service: AdminAccessService | None = None,
) -> FastAPI:
    database = None
    if poi_service is None or admin_access_service is None:
        database = SQLiteDatabase(os.getenv("POI_DB_PATH", ".data/poi.db"))
        database.initialize()
    if poi_service is None:
        poi_service = PoiService(PoiRepository(database), AudioGuideRepository(database))
    if admin_access_service is None:
        secret = os.getenv("JWT_SECRET", "")
        admin_access_service = AdminAccessService(
            UserRepository(database),
            jwt_secret=secret,
            sync_token=os.getenv("POI_ADMIN_SYNC_TOKEN", ""),
        )
    application = FastAPI(title="Q4 POI Service", version="1.0.0")
    application.state.poi_service = poi_service
    application.state.admin_access_service = admin_access_service
    application.include_router(router)
    install_exception_handlers(application)
    return application


app = create_app()

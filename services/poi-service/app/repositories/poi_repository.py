import json
import sqlite3

from app.models import Poi
from app.repositories.sqlite_database import SQLiteDatabase


class PoiRepository:
    def __init__(self, database: SQLiteDatabase) -> None:
        self.database = database

    async def list_active(self, limit: int = 100) -> list[Poi]:
        with self.database.connect() as connection:
            rows = connection.execute(
                "SELECT * FROM pois WHERE is_active = 1 ORDER BY name LIMIT ?",
                (limit,),
            ).fetchall()
        return [self._from_row(row) for row in rows]

    async def get_by_id(self, poi_id: str) -> Poi | None:
        with self.database.connect() as connection:
            row = connection.execute("SELECT * FROM pois WHERE id = ?", (poi_id,)).fetchone()
        return self._from_row(row) if row is not None else None

    async def save(self, poi: Poi) -> Poi:
        with self.database.connect() as connection:
            connection.execute(
                """
                INSERT INTO pois (id, name, category, latitude, longitude, geofence_radius_m, content_json, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    category = excluded.category,
                    latitude = excluded.latitude,
                    longitude = excluded.longitude,
                    geofence_radius_m = excluded.geofence_radius_m,
                    content_json = excluded.content_json,
                    is_active = excluded.is_active
                """,
                (
                    poi.id,
                    poi.name,
                    poi.category,
                    poi.latitude,
                    poi.longitude,
                    poi.geofence_radius_m,
                    json.dumps(poi.content, ensure_ascii=False),
                    int(poi.is_active),
                ),
            )
        return poi

    async def delete(self, poi_id: str) -> bool:
        with self.database.connect() as connection:
            cursor = connection.execute("DELETE FROM pois WHERE id = ?", (poi_id,))
        return cursor.rowcount > 0

    @staticmethod
    def _from_row(row: sqlite3.Row) -> Poi:
        return Poi(
            id=row["id"],
            name=row["name"],
            category=row["category"],
            latitude=row["latitude"],
            longitude=row["longitude"],
            geofence_radius_m=row["geofence_radius_m"],
            content=json.loads(row["content_json"]),
            is_active=bool(row["is_active"]),
        )

from app.models import AudioGuide
from app.repositories.sqlite_database import SQLiteDatabase


class AudioGuideRepository:
    def __init__(self, database: SQLiteDatabase) -> None:
        self.database = database

    async def get(self, poi_id: str, language: str) -> AudioGuide | None:
        with self.database.connect() as connection:
            row = connection.execute(
                "SELECT * FROM audio_guides WHERE poi_id = ? AND language = ?",
                (poi_id, language),
            ).fetchone()
        if row is None:
            return None
        return AudioGuide(
            id=row["id"],
            poi_id=row["poi_id"],
            language=row["language"],
            transcript=row["transcript"],
            audio_url=row["audio_url"],
        )

    async def save(self, guide: AudioGuide) -> AudioGuide:
        with self.database.connect() as connection:
            connection.execute(
                """
                INSERT INTO audio_guides (id, poi_id, language, transcript, audio_url)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(poi_id, language) DO UPDATE SET
                    transcript = excluded.transcript,
                    audio_url = excluded.audio_url
                """,
                (guide.id, guide.poi_id, guide.language, guide.transcript, guide.audio_url),
            )
        return guide

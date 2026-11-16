from app.models import User
from app.repositories.sqlite_database import SQLiteDatabase


class UserRepository:
    def __init__(self, database: SQLiteDatabase) -> None:
        self.database = database

    async def get_by_id(self, user_id: str) -> User | None:
        with self.database.connect() as connection:
            row = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if row is None:
            return None
        return User(id=row["id"], role=row["role"], is_active=bool(row["is_active"]))

    async def save(self, user: User) -> User:
        with self.database.connect() as connection:
            connection.execute(
                """
                INSERT INTO users (id, role, is_active) VALUES (?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET role = excluded.role, is_active = excluded.is_active
                """,
                (user.id, user.role, int(user.is_active)),
            )
        return user

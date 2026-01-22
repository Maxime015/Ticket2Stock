import psycopg2
import psycopg2.extras
import bcrypt
from contextlib import contextmanager
import os
from .env import ENV
import logging

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.conn_params = {
            'dsn': ENV.DATABASE_URL,
        }
    
    @contextmanager
    def get_connection(self):
        conn = psycopg2.connect(**self.conn_params)
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    @contextmanager
    def get_cursor(self, connection=None):
        if connection:
            cursor = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            try:
                yield cursor
            finally:
                cursor.close()
        else:
            with self.get_connection() as conn:
                cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                try:
                    yield cursor
                finally:
                    cursor.close()

db = Database()


def init_db():
    try:
        with db.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

                cur.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        username VARCHAR(255) NOT NULL UNIQUE,
                        email VARCHAR(255) NOT NULL UNIQUE,
                        password VARCHAR(255) NOT NULL,
                        profile_image VARCHAR(255) DEFAULT '',
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                    )
                """)

            conn.commit()  # 🔥 INDISPENSABLE

        logger.info("✅ Base de données initialisée avec succès !")

    except Exception as error:
        logger.error(f"❌ Erreur lors de l'initialisation de la base : {error}")
        raise error



def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def compare_password(user_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        user_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

# Alias pour la compatibilité avec le code existant
sql = db
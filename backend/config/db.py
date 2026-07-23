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

                # Tickets de caisse scannés
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS tickets (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        shop_name VARCHAR(255) DEFAULT '',
                        purchase_date DATE,
                        total NUMERIC(10, 2),
                        total_ht NUMERIC(10, 2),
                        total_tva NUMERIC(10, 2),
                        nb_articles INTEGER,
                        ocr_engine VARCHAR(50) DEFAULT '',
                        raw_json JSONB,
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                    )
                """)

                # Articles extraits de chaque ticket
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS ticket_items (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
                        label VARCHAR(255) NOT NULL,
                        normalized_label VARCHAR(255) NOT NULL,
                        quantity NUMERIC(10, 3) DEFAULT 1,
                        unit_price NUMERIC(10, 2),
                        total_price NUMERIC(10, 2),
                        confidence REAL
                    )
                """)

                # Stock alimentaire courant de l'utilisateur
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS stock_items (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        label VARCHAR(255) NOT NULL,
                        normalized_label VARCHAR(255) NOT NULL,
                        quantity NUMERIC(10, 3) DEFAULT 0,
                        unit VARCHAR(20) DEFAULT 'pc',
                        min_quantity NUMERIC(10, 3) DEFAULT 1,
                        last_price NUMERIC(10, 2),
                        last_purchased_at DATE,
                        purchase_count INTEGER DEFAULT 1,
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE (user_id, normalized_label)
                    )
                """)

                # Liste de courses (générée automatiquement ou manuelle)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS shopping_list_items (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        stock_item_id UUID REFERENCES stock_items(id) ON DELETE SET NULL,
                        label VARCHAR(255) NOT NULL,
                        quantity NUMERIC(10, 3) DEFAULT 1,
                        checked BOOLEAN DEFAULT FALSE,
                        source VARCHAR(20) DEFAULT 'manual',
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                    )
                """)

                # Budgets mensuels (global si category = '', sinon par catégorie)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS budgets (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        category VARCHAR(40) NOT NULL DEFAULT '',
                        amount NUMERIC(10, 2) NOT NULL,
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE (user_id, category)
                    )
                """)

                # Colonnes ajoutées après coup : catégorie de dépense + péremption.
                # ADD COLUMN IF NOT EXISTS évite une migration pour les bases existantes.
                cur.execute(
                    "ALTER TABLE ticket_items ADD COLUMN IF NOT EXISTS "
                    "category VARCHAR(40) NOT NULL DEFAULT 'autres'"
                )
                cur.execute(
                    "ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS "
                    "category VARCHAR(40) NOT NULL DEFAULT 'autres'"
                )
                cur.execute(
                    "ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS expiry_date DATE"
                )

                cur.execute("CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id, created_at DESC)")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_tickets_user_date ON tickets(user_id, purchase_date)")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_ticket_items_ticket ON ticket_items(ticket_id)")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_stock_items_user ON stock_items(user_id)")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_shopping_user ON shopping_list_items(user_id, checked)")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id)")

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
import psycopg
from psycopg.rows import dict_row

DB_PARAMS = "dbname=vitrine user=postgres password=1234 host=localhost port=5432"

def get_db_connection():
    """
    Retorna uma conexão com o banco de dados PostgreSQL com dict_row ativa.
    Deve ser utilizada como um generator para injeção de dependências no FastAPI.
    """
    conn = psycopg.connect(DB_PARAMS, row_factory=dict_row)
    try:
        yield conn
    finally:
        conn.close()

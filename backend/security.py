"""
Camada de seguranca do LocalMarket.

- Hash de senha com bcrypt (as senhas nunca ficam em texto puro no banco).
- Token de acesso JWT emitido no login/registro e validado nas rotas protegidas.

A chave secreta pode ser definida na variavel de ambiente VITRINE_SECRET.
Em producao, defina uma chave forte e mantenha-a fora do codigo.
"""
import os
import datetime

import bcrypt
import jwt

# ==========================================
# CONFIGURACAO
# ==========================================

SECRET_KEY = os.getenv("VITRINE_SECRET", "troque-esta-chave-em-producao-1a2b3c")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 12


# ==========================================
# SENHAS (bcrypt)
# ==========================================

def hash_password(plain_password: str) -> str:
    """Gera o hash bcrypt de uma senha em texto puro."""
    senha_bytes = (plain_password or "").encode("utf-8")[:72]  # bcrypt limita a 72 bytes
    return bcrypt.hashpw(senha_bytes, bcrypt.gensalt()).decode("utf-8")


def is_bcrypt_hash(value: str) -> bool:
    """Diz se o valor armazenado ja e um hash bcrypt (comeca com $2)."""
    return isinstance(value, str) and value.startswith(("$2a$", "$2b$", "$2y$"))


def verify_password(plain_password: str, stored_value: str) -> bool:
    """
    Confere a senha. Compatibilidade retroativa: se o valor guardado ainda
    estiver em texto puro (banco antigo), compara diretamente. Assim o login
    continua funcionando enquanto as senhas migram para hash.
    """
    if not stored_value:
        return False

    if is_bcrypt_hash(stored_value):
        try:
            return bcrypt.checkpw(
                (plain_password or "").encode("utf-8")[:72],
                stored_value.encode("utf-8"),
            )
        except ValueError:
            return False

    # valor legado em texto puro
    return plain_password == stored_value


# ==========================================
# TOKEN JWT
# ==========================================

def create_access_token(email: str, role: str) -> str:
    """Cria um token JWT assinado com o e-mail e o papel do usuario."""
    agora = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": email,
        "role": role,
        "iat": agora,
        "exp": agora + datetime.timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Valida e decodifica um token JWT. Lanca jwt.PyJWTError se invalido/expirado."""
    return jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])

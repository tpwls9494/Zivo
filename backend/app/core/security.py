"""AES-256-GCM encryption for sensitive fields (passport number, etc.) + JWT helpers.

AES key must be 32 raw bytes, provided as base64 in AES_ENCRYPTION_KEY.
Ciphertext layout: nonce(12) || ciphertext || tag(16), base64-encoded for DB storage.
"""

from __future__ import annotations

import base64
import os
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import settings

_NONCE_BYTES = 12


def _aes_key() -> bytes:
    if not settings.AES_ENCRYPTION_KEY:
        raise RuntimeError("AES_ENCRYPTION_KEY not configured")
    key = base64.b64decode(settings.AES_ENCRYPTION_KEY)
    if len(key) != 32:
        raise RuntimeError("AES_ENCRYPTION_KEY must decode to 32 bytes")
    return key


def encrypt_sensitive(plaintext: str) -> str:
    if not plaintext:
        return ""
    aes = AESGCM(_aes_key())
    nonce = os.urandom(_NONCE_BYTES)
    ciphertext = aes.encrypt(nonce, plaintext.encode("utf-8"), associated_data=None)
    return base64.b64encode(nonce + ciphertext).decode("ascii")


def decrypt_sensitive(token: str) -> str:
    if not token:
        return ""
    raw = base64.b64decode(token)
    nonce, ciphertext = raw[:_NONCE_BYTES], raw[_NONCE_BYTES:]
    aes = AESGCM(_aes_key())
    return aes.decrypt(nonce, ciphertext, associated_data=None).decode("utf-8")


def mask_passport(number: str) -> str:
    if len(number) < 4:
        return "***"
    return f"{number[:2]}{'*' * (len(number) - 4)}{number[-2:]}"


def create_access_token(
    subject: str,
    expires_minutes: int = 60 * 24 * 7,
    extra: dict | None = None,
) -> str:
    now = datetime.now(UTC)
    payload: dict[str, Any] = {"sub": subject, "iat": now, "exp": now + timedelta(minutes=expires_minutes)}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")


def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])

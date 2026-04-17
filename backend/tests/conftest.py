from __future__ import annotations

from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.db import session as db_session
from app.main import app


@pytest_asyncio.fixture(autouse=True)
async def _isolated_db_engine() -> AsyncIterator[None]:
    """Per-test engine with NullPool so connections never straddle event loops.

    pytest-asyncio creates a fresh event loop per test; SQLAlchemy's default pool
    retains connections bound to the previous test's (now-closed) loop, leading to
    `Event loop is closed` errors. NullPool opens and discards a connection per
    checkout, which is safe across loops.
    """
    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
    sessionmaker = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    orig_engine = db_session.engine
    orig_sessionmaker = db_session.AsyncSessionLocal
    db_session.engine = engine
    db_session.AsyncSessionLocal = sessionmaker

    async def _get_db() -> AsyncIterator[AsyncSession]:
        async with sessionmaker() as s:
            yield s

    db_session.get_db = _get_db  # type: ignore[assignment]
    app.dependency_overrides[orig_sessionmaker] = sessionmaker  # harmless no-op

    # Re-point FastAPI's existing get_db dependency override.
    from app.db.session import get_db as _real_get_db

    app.dependency_overrides[_real_get_db] = _get_db

    try:
        yield
    finally:
        app.dependency_overrides.clear()
        db_session.engine = orig_engine
        db_session.AsyncSessionLocal = orig_sessionmaker
        await engine.dispose()


@pytest_asyncio.fixture
async def client() -> AsyncIterator[AsyncClient]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c

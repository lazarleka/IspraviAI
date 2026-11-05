"""Integration tests run against a real database: a temporary SQLite file, created once per package.

Set DATABASE_URL (e.g. to a Postgres from `docker compose up -d db`) to run the same tests on it.
"""

from __future__ import annotations

import os
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.config.settings import DBSettings, Settings
from app.database.base import Base
from app.database.session_factory import ISessionFactory, SessionFactory
from app.decks.models.card import Card
from app.decks.models.deck import Deck
from app.friends.models.friendship import Friendship
from app.matches.models.challenge import Challenge
from app.matches.models.match import Match
from app.matches.models.match_answer import MatchAnswer
from app.study.models.card_progress import CardProgress
from app.users.models.user import User
from app.utils.di import add_to_di_container, get_from_di_container

pytestmark = pytest.mark.integration


@pytest.fixture(scope="package")
def setup_db(tmp_path_factory: pytest.TempPathFactory) -> Generator[None]:
    previous_settings = get_from_di_container(Settings)
    previous_session_factory = get_from_di_container(ISessionFactory)

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        db_file: Path = tmp_path_factory.mktemp("db") / "test.db"
        database_url = f"sqlite:///{db_file}"

    new_settings = previous_settings.model_copy(update={"DATABASE_URL": database_url})
    add_to_di_container(Settings, new_settings)
    add_to_di_container(DBSettings, new_settings)
    add_to_di_container(ISessionFactory, SessionFactory(new_settings))

    yield

    add_to_di_container(Settings, previous_settings)
    add_to_di_container(DBSettings, previous_settings)
    add_to_di_container(ISessionFactory, previous_session_factory)


@pytest.fixture(scope="package", autouse=True)
def tables(setup_db: None) -> Generator[None]:  # noqa: ARG001
    session_factory = get_from_di_container(ISessionFactory)

    # Tests build the schema from the models; the app itself only ever uses migrations (ADR-004).
    Base.metadata.create_all(bind=session_factory.engine)

    yield

    Base.metadata.drop_all(bind=session_factory.engine)


@pytest.fixture(autouse=True)
def clean_tables() -> Generator[None]:
    """Every test starts from empty tables, so tests cannot depend on each other's rows."""
    yield
    session_factory = get_from_di_container(ISessionFactory)
    with session_factory() as session:
        session.execute(delete(MatchAnswer))
        session.execute(delete(Match))
        session.execute(delete(Challenge))
        session.execute(delete(CardProgress))
        session.execute(delete(Card))
        session.execute(delete(Deck))
        session.execute(delete(Friendship))
        session.execute(delete(User))
        session.commit()


def register(client: TestClient, email: str, username: str | None = None) -> dict[str, str]:
    resolved_username = username or email.split("@")[0]
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "secret123",
            "displayName": resolved_username,
            "username": resolved_username,
        },
    )
    assert response.status_code == 201, response.text
    return {"Authorization": f"Bearer {response.json()['token']}"}


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    return register(client, "ana@example.com")


@pytest.fixture
def other_auth_headers(client: TestClient) -> dict[str, str]:
    return register(client, "marko@example.com")

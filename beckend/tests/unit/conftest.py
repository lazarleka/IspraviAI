from __future__ import annotations

from collections.abc import Generator
from unittest.mock import Mock, create_autospec

import pytest

from app.auth.services.auth import IAuthService
from app.database.session_factory import ISessionFactory
from app.decks.services.deck import IDeckService
from app.friends.services.friendship import IFriendshipService
from app.study.services.study import IStudyService
from app.users.services.user import IUserService
from app.utils.di import add_to_di_container, get_from_di_container, remove_from_di_container
from tests.unit.utils import MockSessionFactory
from tests.utils import create_current_user


@pytest.fixture(scope="package", autouse=True)
def session_factory() -> Generator[None]:
    previous_session_factory = get_from_di_container(ISessionFactory)
    add_to_di_container(ISessionFactory, MockSessionFactory())
    yield
    add_to_di_container(ISessionFactory, previous_session_factory)


@pytest.fixture(autouse=True)
def auth_service() -> Generator[Mock]:
    """Every request is authenticated as user 1 by default; a test can change the return value."""
    mock_service = create_autospec(IAuthService, instance=True)
    mock_service.get_current_user.return_value = create_current_user(1)
    add_to_di_container(IAuthService, mock_service)
    yield mock_service
    # removing the override restores the original service because it is a "factory"
    remove_from_di_container(IAuthService)


@pytest.fixture
def user_service() -> Generator[Mock]:
    mock_service = create_autospec(IUserService, instance=True)
    add_to_di_container(IUserService, mock_service)
    yield mock_service
    remove_from_di_container(IUserService)


@pytest.fixture
def deck_service() -> Generator[Mock]:
    mock_service = create_autospec(IDeckService, instance=True)
    add_to_di_container(IDeckService, mock_service)
    yield mock_service
    remove_from_di_container(IDeckService)


@pytest.fixture
def study_service() -> Generator[Mock]:
    mock_service = create_autospec(IStudyService, instance=True)
    add_to_di_container(IStudyService, mock_service)
    yield mock_service
    remove_from_di_container(IStudyService)


@pytest.fixture
def friendship_service() -> Generator[Mock]:
    mock_service = create_autospec(IFriendshipService, instance=True)
    add_to_di_container(IFriendshipService, mock_service)
    yield mock_service
    remove_from_di_container(IFriendshipService)

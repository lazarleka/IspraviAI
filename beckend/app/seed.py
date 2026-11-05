"""Idempotent demo data for `poetry run seed`."""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from app.auth.schemas.auth import CurrentUser, LoginRequestSchema, RegisterRequestSchema
from app.auth.services.auth import IAuthService
from app.database.session_handler import db_session_handler
from app.decks.generation.generator import ICardGenerator
from app.decks.models.card import Card
from app.decks.models.deck import Deck, DeckSourceType, DeckStatus, DeckSubject
from app.decks.repositories.deck import IDeckRepository
from app.friends.models.friendship import Friendship, FriendshipStatus
from app.friends.repositories.friendship import IFriendshipRepository
from app.utils.di import get_from_di_container
from app.utils.pagination import PaginationParams

logger = logging.getLogger(__name__)

DEMO_PASSWORD = "demo1234"
USERS = (
    ("demo@example.com", "demo", "Demo User"),
    ("marko@example.com", "marko_v", "Marko Vuković"),
    ("jelena@example.com", "jelena", "Jelena Đurović"),
    ("nikola@example.com", "nikola_r", "Nikola Radonjić"),
)
DECKS = (
    ("Fotosinteza", "Fotosinteza kod biljaka", DeckSubject.BIOLOGY),
    ("Prvi i Drugi srpski ustanak", "Prvi i Drugi srpski ustanak", DeckSubject.HISTORY),
    ("Rekurzija u C-u", "Rekurzija i nizovi u C-u", DeckSubject.PROGRAMMING),
)


def _get_or_create_user(
    service: IAuthService, email: str, username: str, display_name: str
) -> CurrentUser:
    try:
        auth = service.login(LoginRequestSchema(email=email, password=DEMO_PASSWORD))
    except Exception:
        auth = service.register(
            RegisterRequestSchema(
                email=email,
                password=DEMO_PASSWORD,
                display_name=display_name,
                username=username,
            )
        )
    return service.get_current_user(auth.token)


@db_session_handler
def seed() -> None:
    auth_service = get_from_di_container(IAuthService)
    users = [_get_or_create_user(auth_service, *data) for data in USERS]
    friendships = get_from_di_container(IFriendshipRepository)
    for friend in users[1:]:
        if friendships.get_pair(users[0].id, friend.id) is None:
            low_id, high_id = sorted((users[0].id, friend.id))
            friendships.add(
                Friendship(
                    user_low_id=low_id,
                    user_high_id=high_id,
                    requested_by_id=users[0].id,
                    status=FriendshipStatus.ACCEPTED,
                    accepted_at=datetime.now(UTC),
                )
            )

    deck_repository = get_from_di_container(IDeckRepository)
    existing = deck_repository.list_for_owner(users[0].id, PaginationParams(page=1, size=500))
    existing_titles = {deck.title for deck in existing.items}
    generator = get_from_di_container(ICardGenerator)
    for title, topic, subject in DECKS:
        if title in existing_titles:
            continue
        deck = deck_repository.add(
            Deck(
                title=title,
                subject=subject,
                source_type=DeckSourceType.TOPIC,
                topic=topic,
                file_name=None,
                requested_cards=10,
                source_text=topic,
                owner_id=users[0].id,
                status=DeckStatus.READY,
            )
        )
        deck_repository.add_cards(
            [
                Card(deck_id=deck.id, **candidate.model_dump())
                for candidate in generator.generate(topic, 10)
            ]
        )
    logger.info("Demo seed ready: %s / %s", USERS[0][0], DEMO_PASSWORD)

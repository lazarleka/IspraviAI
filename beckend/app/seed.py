"""Idempotent demo data for `poetry run seed`."""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.auth.schemas.auth import CurrentUser, LoginRequestSchema, RegisterRequestSchema
from app.auth.services.auth import IAuthService
from app.database.session_factory import ISessionFactory
from app.database.session_handler import db_session_handler
from app.decks.generation.generator import ICardGenerator
from app.decks.models.card import Card
from app.decks.models.deck import Deck, DeckKind, DeckSourceType, DeckStatus, DeckSubject
from app.decks.repositories.deck import IDeckRepository
from app.friends.models.friendship import Friendship, FriendshipStatus
from app.friends.repositories.friendship import IFriendshipRepository
from app.matches.models.challenge import Challenge, ChallengeStatus
from app.matches.models.match import Match, MatchStatus
from app.matches.models.match_answer import MatchAction, MatchAnswer
from app.study.models.card_progress import CardProgress
from app.users.models.user import User
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
        auth = service.login(LoginRequestSchema(identifier=email, password=DEMO_PASSWORD))
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
    _seed_profile_and_progress(users[0])
    _seed_finished_match(users[0], users[1], generator)
    logger.info("Demo seed ready: %s / %s", USERS[0][0], DEMO_PASSWORD)


def _seed_profile_and_progress(demo: CurrentUser) -> None:
    session = get_from_di_container(ISessionFactory)()
    user = session.get(User, demo.id)
    if user is not None:
        user.avatar_color = "green"
        user.daily_goal = 15

    cards = list(
        session.scalars(
            select(Card)
            .join(Deck)
            .where(Deck.owner_id == demo.id, Deck.kind == DeckKind.STUDY)
            .order_by(Card.id)
            .limit(8)
        ).all()
    )
    existing = set(
        session.scalars(
            select(CardProgress.card_id).where(
                CardProgress.user_id == demo.id,
                CardProgress.card_id.in_([card.id for card in cards]),
            )
        ).all()
    )
    for index, card in enumerate(cards):
        if card.id in existing:
            continue
        session.add(
            CardProgress(
                user_id=demo.id,
                card_id=card.id,
                box=min(4, index % 4 + 1),
                due_at=datetime.now(UTC) + timedelta(days=index % 3),
                correct_count=2 + index,
                wrong_count=index % 2,
                last_seen_at=datetime.now(UTC) - timedelta(days=index),
                reported=False,
            )
        )


def _seed_finished_match(
    demo: CurrentUser, opponent: CurrentUser, generator: ICardGenerator
) -> None:
    session = get_from_di_container(ISessionFactory)()
    existing = session.scalar(
        select(Match.id).where(
            Match.player1_id == demo.id,
            Match.player2_id == opponent.id,
            Match.status == MatchStatus.FINISHED,
        )
    )
    if existing is not None:
        return

    topic = "Fotosinteza"
    deck = Deck(
        title="Demo meč: Fotosinteza",
        subject=DeckSubject.BIOLOGY,
        source_type=DeckSourceType.TOPIC,
        topic=topic,
        file_name=None,
        kind=DeckKind.MATCH,
        status=DeckStatus.READY,
        requested_cards=5,
        source_text=topic,
        owner_id=demo.id,
    )
    session.add(deck)
    session.flush()
    cards = [
        Card(deck_id=deck.id, **candidate.model_dump())
        for candidate in generator.generate(topic, 5)
    ]
    session.add_all(cards)
    session.flush()

    finished_at = datetime.now(UTC) - timedelta(hours=2)
    challenge = Challenge(
        challenger_id=demo.id,
        opponent_id=opponent.id,
        deck_id=deck.id,
        topic=topic,
        card_count=5,
        status=ChallengeStatus.ACCEPTED,
        expires_at=finished_at + timedelta(minutes=2),
        created_at=finished_at - timedelta(minutes=5),
    )
    session.add(challenge)
    session.flush()
    match = Match(
        challenge_id=challenge.id,
        deck_id=deck.id,
        player1_id=demo.id,
        player2_id=opponent.id,
        player1_score=55,
        player2_score=20,
        status=MatchStatus.FINISHED,
        winner_id=demo.id,
        started_at=finished_at - timedelta(minutes=3),
        finished_at=finished_at,
    )
    session.add(match)
    session.flush()
    for index, card in enumerate(cards):
        session.add_all(
            [
                MatchAnswer(
                    match_id=match.id,
                    card_id=card.id,
                    user_id=demo.id,
                    action=MatchAction.TAP,
                    selected_index=card.wrong_index,
                    correct=True,
                    response_ms=1800 + index * 250,
                    points=11,
                ),
                MatchAnswer(
                    match_id=match.id,
                    card_id=card.id,
                    user_id=opponent.id,
                    action=MatchAction.TAP,
                    selected_index=0,
                    correct=False,
                    response_ms=2500 + index * 300,
                    points=-5,
                ),
            ]
        )

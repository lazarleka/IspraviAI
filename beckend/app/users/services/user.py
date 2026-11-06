from __future__ import annotations

from typing import Protocol

from sqlalchemy.exc import IntegrityError

from app.auth.exceptions.auth import UsernameTakenException
from app.auth.schemas.auth import CurrentUser
from app.matches.repositories.match import IMatchRepository
from app.study.repositories.study import IStudyRepository
from app.users.exceptions.user import UserNotFoundException
from app.users.repositories.user import IUserRepository
from app.users.schemas.user import (
    PublicUserSchema,
    UserResponseSchema,
    UserStatsSchema,
    UserUpdateSchema,
)
from app.utils.di import inject
from app.utils.pagination import Page, PaginationParams


class IUserService(Protocol):
    def update_profile(
        self, data: UserUpdateSchema, current_user: CurrentUser
    ) -> UserResponseSchema: ...

    def stats(self, current_user: CurrentUser) -> UserStatsSchema: ...

    def search(
        self, search: str, pagination_params: PaginationParams, current_user: CurrentUser
    ) -> Page[PublicUserSchema]: ...


@inject(alias=IUserService)
class UserService(IUserService):
    def __init__(
        self,
        user_repository: IUserRepository,
        match_repository: IMatchRepository,
        study_repository: IStudyRepository,
    ) -> None:
        self._user_repository = user_repository
        self._match_repository = match_repository
        self._study_repository = study_repository

    def stats(self, current_user: CurrentUser) -> UserStatsSchema:
        matches = self._match_repository.stats_for_user(current_user.id)
        study = self._study_repository.stats_for_user(current_user.id)
        correct = matches.correct_answers + study.correct_answers
        wrong = matches.wrong_answers + study.wrong_answers
        answers = correct + wrong
        return UserStatsSchema(
            matches_played=matches.played,
            wins=matches.wins,
            losses=matches.losses,
            draws=matches.draws,
            win_rate=round(matches.wins * 100 / matches.played) if matches.played else 0,
            total_score=matches.total_score,
            best_score=matches.best_score,
            cards_reviewed=study.cards_reviewed,
            correct_answers=correct,
            wrong_answers=wrong,
            accuracy=round(correct * 100 / answers) if answers else 0,
        )

    def update_profile(
        self, data: UserUpdateSchema, current_user: CurrentUser
    ) -> UserResponseSchema:
        user = self._user_repository.get_by_id(current_user.id)
        if user is None:
            raise UserNotFoundException

        if data.display_name is not None:
            user.display_name = data.display_name.strip()
        if data.username is not None:
            user.username = data.username.lower()
        if data.avatar_color is not None:
            user.avatar_color = data.avatar_color
        if data.daily_goal is not None:
            user.daily_goal = data.daily_goal
        if data.sound_enabled is not None:
            user.sound_enabled = data.sound_enabled
        if data.animations_enabled is not None:
            user.animations_enabled = data.animations_enabled

        try:
            user = self._user_repository.save(user)
        except IntegrityError as error:
            raise UsernameTakenException from error
        return UserResponseSchema.model_validate(user)

    def search(
        self, search: str, pagination_params: PaginationParams, current_user: CurrentUser
    ) -> Page[PublicUserSchema]:
        users = self._user_repository.search(
            search=search.lower(),
            exclude_user_id=current_user.id,
            pagination_params=pagination_params,
        )
        return Page(
            total=users.total,
            items=[PublicUserSchema.model_validate(user) for user in users.items],
            pages=users.pages,
        )

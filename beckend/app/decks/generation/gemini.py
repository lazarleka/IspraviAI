from __future__ import annotations

from math import ceil

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from app.config.settings import Settings
from app.decks.generation.generator import ICardGenerator
from app.decks.generation.prompts import cards_prompt, facts_prompt, verification_prompt
from app.decks.schemas.card import CardCandidateSchema

MISSING_KEY_MESSAGE = "GEMINI_API_KEY is required when LLM_PROVIDER=gemini"
EMPTY_RESPONSE_MESSAGE = "Gemini returned an empty response"


class GeneratedFact(BaseModel):
    key: str = Field(min_length=1, max_length=100)
    statement: str = Field(min_length=1, max_length=500)
    source_ref: str | None = Field(default=None, max_length=200)


class GeneratedFacts(BaseModel):
    facts: list[GeneratedFact]


class GeneratedCards(BaseModel):
    cards: list[CardCandidateSchema]


class VerificationResult(BaseModel):
    accepted_indexes: list[int]


class GeminiCardGenerator(ICardGenerator):
    def __init__(self, settings: Settings, client: genai.Client | None = None) -> None:
        if not settings.GEMINI_API_KEY and client is None:
            raise ValueError(MISSING_KEY_MESSAGE)
        self._model = settings.GEMINI_MODEL
        self._client = client or genai.Client(api_key=settings.GEMINI_API_KEY)

    def generate(self, source_text: str, requested_cards: int) -> list[CardCandidateSchema]:
        facts_response = self._client.models.generate_content(
            model=self._model,
            contents=facts_prompt(source_text, ceil(requested_cards / 2)),
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeneratedFacts,
                temperature=0.2,
            ),
        )
        facts = GeneratedFacts.model_validate_json(self._text(facts_response))

        cards_response = self._client.models.generate_content(
            model=self._model,
            contents=cards_prompt(facts.model_dump_json(), requested_cards),
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeneratedCards,
                temperature=0.7,
            ),
        )
        generated = GeneratedCards.model_validate_json(self._text(cards_response))
        candidates = generated.cards[:requested_cards]

        verification_response = self._client.models.generate_content(
            model=self._model,
            contents=verification_prompt(
                source_text,
                GeneratedCards(cards=candidates).model_dump_json(),
            ),
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=VerificationResult,
                temperature=0,
            ),
        )
        verification = VerificationResult.model_validate_json(self._text(verification_response))
        accepted = set(verification.accepted_indexes)
        return [card for index, card in enumerate(candidates) if index in accepted]

    @staticmethod
    def _text(response: types.GenerateContentResponse) -> str:
        if not response.text:
            raise ValueError(EMPTY_RESPONSE_MESSAGE)
        return response.text

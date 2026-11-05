from __future__ import annotations

from types import SimpleNamespace
from typing import cast
from unittest.mock import Mock

import pytest
from google import genai

from app.decks.generation.gemini import (
    GeminiCardGenerator,
    GeneratedCards,
    GeneratedFact,
    GeneratedFacts,
    VerificationResult,
)
from app.decks.models.card import CardErrorType, CardKind
from app.decks.schemas.card import CardCandidateSchema
from tests.utils import TestSettings as SettingsForTests

pytestmark = pytest.mark.unit


def candidate(index: int) -> CardCandidateSchema:
    return CardCandidateSchema(
        fact_key=f"fact-{index}",
        kind=CardKind.TEXT,
        language=None,
        segments=["Tačan dio", f"Pogrešan dio {index}"],
        wrong_index=1,
        correct_text=f"Ispravka {index}",
        explanation="Objašnjenje.",
        error_type=CardErrorType.FACT,
        source_ref=None,
    )


def test_gemini_generator_uses_structured_three_step_pipeline() -> None:
    client = Mock()
    client.models.generate_content.side_effect = [
        SimpleNamespace(
            text=GeneratedFacts(
                facts=[GeneratedFact(key="fact", statement="Provjerena činjenica")]
            ).model_dump_json()
        ),
        SimpleNamespace(
            text=GeneratedCards(cards=[candidate(index) for index in range(5)]).model_dump_json(
                by_alias=True
            )
        ),
        SimpleNamespace(
            text=VerificationResult(accepted_indexes=[0, 1, 2, 3, 4]).model_dump_json(by_alias=True)
        ),
    ]
    settings = SettingsForTests(GEMINI_API_KEY="test-key", GEMINI_MODEL="test-model")
    generator = GeminiCardGenerator(settings, client=cast(genai.Client, client))

    cards = generator.generate("Izvorni tekst", 5)

    assert len(cards) == 5
    assert client.models.generate_content.call_count == 3
    assert all(
        call.kwargs["model"] == "test-model"
        for call in client.models.generate_content.call_args_list
    )


def test_gemini_generator_requires_key() -> None:
    settings = SettingsForTests(GEMINI_API_KEY=None)

    with pytest.raises(ValueError, match="GEMINI_API_KEY"):
        GeminiCardGenerator(settings)

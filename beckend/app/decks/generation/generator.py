from __future__ import annotations

from typing import Protocol

from app.decks.schemas.card import CardCandidateSchema
from app.utils.di import inject


class ICardGenerator(Protocol):
    def generate(self, source_text: str, requested_cards: int) -> list[CardCandidateSchema]: ...


_FAKE_CARDS: list[dict[str, object]] = [
    {
        "fact_key": "photosynthesis-place",
        "segments": ["Fotosinteza se odvija", "u mitohondrijama", "biljnih ćelija."],
        "wrong_index": 1,
        "correct_text": "u hloroplastima",
        "explanation": "Fotosinteza se odvija u hloroplastima.",
        "error_type": "fact",
    },
    {
        "fact_key": "photosynthesis-light",
        "segments": ["Za fotosintezu", "nije potrebna svjetlost."],
        "wrong_index": 1,
        "correct_text": "potrebna je svjetlost.",
        "explanation": "Svjetlost pokreće svjetlosnu fazu fotosinteze.",
        "error_type": "logic",
    },
    {
        "fact_key": "photosynthesis-gases",
        "segments": ["Biljka uzima ugljen-dioksid", "i otpušta ugljen-dioksid."],
        "wrong_index": 1,
        "correct_text": "i otpušta kiseonik.",
        "explanation": "Kiseonik je proizvod fotosinteze.",
        "error_type": "fact",
    },
    {
        "fact_key": "chlorophyll",
        "segments": ["Hlorofil upija", "zelenu svjetlost", "i zato su listovi zeleni."],
        "wrong_index": 1,
        "correct_text": "crvenu i plavu svjetlost",
        "explanation": "Hlorofil odbija zelenu svjetlost.",
        "error_type": "logic",
    },
    {
        "fact_key": "equation-product",
        "segments": ["6CO₂ + 6H₂O", "→ C₆H₁₂O₆ + 6CO₂"],
        "wrong_index": 1,
        "correct_text": "→ C₆H₁₂O₆ + 6O₂",
        "explanation": "Proizvodi su glukoza i kiseonik.",
        "error_type": "calculation",
    },
    {
        "fact_key": "equation-input",
        "segments": ["6CO₂ + 12O₂", "→ C₆H₁₂O₆ + 6O₂"],
        "wrong_index": 0,
        "correct_text": "6CO₂ + 6H₂O",
        "explanation": "Polazne supstance su ugljen-dioksid i voda.",
        "error_type": "calculation",
    },
    {
        "fact_key": "glucose",
        "segments": ["Glukoza biljci služi", "isključivo kao izvor energije."],
        "wrong_index": 1,
        "correct_text": "kao izvor energije i gradivni materijal.",
        "explanation": "Glukoza je i gradivni materijal.",
        "error_type": "exaggeration",
    },
    {
        "fact_key": "water",
        "segments": ["Biljka vodu", "najčešće uzima korijenom."],
        "wrong_index": None,
        "correct_text": None,
        "explanation": "Voda se najčešće usvaja preko korijena.",
        "error_type": None,
    },
    {
        "fact_key": "source",
        "segments": ["Izmišljeno istraživanje tvrdi", "da fotosinteza ne stvara kiseonik."],
        "wrong_index": 0,
        "correct_text": "Pouzdani udžbenici potvrđuju",
        "explanation": "Navod nema stvaran izvor.",
        "error_type": "fake_source",
    },
    {
        "fact_key": "energy",
        "segments": ["Svjetlosna energija", "pretvara se u hemijsku energiju."],
        "wrong_index": None,
        "correct_text": None,
        "explanation": "Fotosinteza skladišti energiju u hemijskim vezama.",
        "error_type": None,
    },
]


@inject(alias=ICardGenerator)
class FakeCardGenerator(ICardGenerator):
    def generate(self, source_text: str, requested_cards: int) -> list[CardCandidateSchema]:
        del source_text
        cards: list[CardCandidateSchema] = []
        while len(cards) < requested_cards:
            index = len(cards) % len(_FAKE_CARDS)
            data = dict(_FAKE_CARDS[index])
            data["fact_key"] = f"{data['fact_key']}-{len(cards)}"
            data.update({"kind": "text", "language": None, "source_ref": None})
            cards.append(CardCandidateSchema.model_validate(data))
        return cards

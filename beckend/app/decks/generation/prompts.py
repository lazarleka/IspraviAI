from __future__ import annotations


def facts_prompt(source_text: str, fact_count: int) -> str:
    return f"""You create study material in Montenegrin (Latin, ijekavian).
Extract {fact_count} independent, verifiable facts from the source below.
Keep each fact concise and include a source reference only when the source provides one.
Do not invent sources or information.

SOURCE:
{source_text}
"""


def cards_prompt(facts_json: str, requested_cards: int) -> str:
    return f"""Create exactly {requested_cards} Ispravi AI cards in Montenegrin from the facts below.
Create about two variants per fact and move the error to a different segment between variants.
Each card has 2-8 non-empty segments. Usually exactly one segment is wrong; about one card in ten
has no error (wrongIndex, correctText and errorType are null). For an incorrect card, correctText must
differ from the wrong segment. Explanations must be under 300 characters. Never invent a source.
Use kind "text" unless the fact is code. Allowed errorType values: fact, calculation, logic,
fake_source, exaggeration, code_bug.

FACTS JSON:
{facts_json}
"""


def verification_prompt(source_text: str, cards_json: str) -> str:
    return f"""Verify each numbered card against the source. Accept an index only when exactly the
declared segment is wrong (or every segment is correct when wrongIndex is null), all other segments
agree with the source, the correction is accurate, and no source was invented. Return acceptedIndexes.

SOURCE:
{source_text}

CARDS JSON:
{cards_json}
"""

"""Pydantic AI flashcard generation boundary."""

from __future__ import annotations

import os
import re
from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StrictInt,
    StringConstraints,
    model_validator,
)
from pydantic_ai import Agent
from pydantic_ai.exceptions import UnexpectedModelBehavior

_CLOZE = re.compile(r"\{\{c\d+::[^{}]+\}\}")
_MAX_SOURCE_LENGTH = 100_000


class BasicCard(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=128)
    type: Literal["basic"]
    front: str = Field(min_length=1, max_length=10_000)
    back: str = Field(min_length=1, max_length=10_000)
    tags: list[Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]] = Field(
        max_length=20
    )

    @model_validator(mode="after")
    def unique_tags(self) -> BasicCard:
        if len(set(self.tags)) != len(self.tags):
            raise ValueError("tags must be unique")
        return self


class ClozeCard(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=128)
    type: Literal["cloze"]
    text: str = Field(min_length=1, max_length=10_000)
    tags: list[Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]] = Field(
        max_length=20
    )

    @model_validator(mode="after")
    def validate_cloze(self) -> ClozeCard:
        if len(set(self.tags)) != len(self.tags):
            raise ValueError("tags must be unique")
        if not _CLOZE.search(self.text):
            raise ValueError("cloze cards must contain at least one cloze deletion")
        return self


Card = Annotated[BasicCard | ClozeCard, Field(discriminator="type")]


class GeneratedCards(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cards: list[Card] = Field(min_length=1, max_length=50)


class CardCollectionPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cards: list[Card] = Field(max_length=50)


class FlashcardGenerationResponse(GeneratedCards):
    correlation_id: str = Field(min_length=1, max_length=128)


class FlashcardGenerationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_text: str = Field(
        min_length=1,
        max_length=_MAX_SOURCE_LENGTH,
        description="Source material used to create cards.",
    )
    card_types: list[Literal["basic", "cloze"]] = Field(min_length=1, max_length=2)
    requested_count: StrictInt = Field(ge=1, le=50)

    @model_validator(mode="after")
    def validate_options(self) -> FlashcardGenerationRequest:
        self.source_text = self.source_text.strip()
        if not self.source_text:
            raise ValueError("source_text must not be empty")
        if len(set(self.card_types)) != len(self.card_types):
            raise ValueError("card_types must contain unique values")
        return self


class RefinementRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    card: Card
    instruction: str = Field(min_length=1, max_length=2_000)


class BulkRefinementRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cards: list[Card] = Field(min_length=1, max_length=50)
    instruction: str = Field(min_length=1, max_length=2_000)


class FlashcardGenerationError(Exception):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


def _agent_model() -> str:
    """Resolve the provider/model only when a request is made."""

    return os.getenv("AI_MODEL", "openai:gpt-4o-mini")


# This name is part of the backend boundary and makes the orchestration
# explicit. Tests replace this agent's model with a Pydantic AI test model.
flashcard_generation_agent = Agent(
    # Resolve provider credentials lazily, so importing the application never
    # requires credentials and tests can install a Pydantic AI TestModel.
    model=None,
    output_type=GeneratedCards,
    instructions=(
        "Create only valid basic or cloze Anki cards from the supplied source. "
        "Use requested card types and count. Never include explanations."
    ),
)


async def generate_flashcards(
    payload: FlashcardGenerationRequest,
) -> FlashcardGenerationResponse:
    prompt = (
        f"Source text:\n{payload.source_text}\n\n"
        f"Allowed card types: {', '.join(payload.card_types)}\n"
        f"Requested count: {payload.requested_count}"
    )
    try:
        result = await flashcard_generation_agent.run(
            prompt,
            model=_agent_model(),
        )
    except UnexpectedModelBehavior as error:
        raise FlashcardGenerationError(
            "invalid_model_output",
            "The flashcard provider returned invalid structured cards.",
            502,
        ) from error
    except Exception as error:
        raise FlashcardGenerationError(
            "provider_failure",
            "The flashcard provider could not generate cards.",
            502,
        ) from error

    output = result.output
    if not output.cards:
        raise FlashcardGenerationError(
            "invalid_model_output",
            "The flashcard provider returned no cards.",
            502,
        )
    if len(output.cards) > payload.requested_count:
        raise FlashcardGenerationError(
            "invalid_model_output",
            "The flashcard provider returned too many cards.",
            502,
        )
    if any(card.type not in payload.card_types for card in output.cards):
        raise FlashcardGenerationError(
            "invalid_model_output",
            "The flashcard provider returned a disallowed card type.",
            502,
        )
    return output


async def refine_flashcard(payload: RefinementRequest) -> BasicCard | ClozeCard:
    card_json = payload.card.model_dump_json()
    request = FlashcardGenerationRequest(
        source_text=(
            "Refine this card according to the instruction.\n"
            f"Instruction: {payload.instruction}\nCard: {card_json}"
        ),
        card_types=[payload.card.type],
        requested_count=1,
    )
    result = await generate_flashcards(request)
    refined = result.cards[0]
    return refined.model_copy(update={"id": payload.card.id})

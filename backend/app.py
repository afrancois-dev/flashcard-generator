"""Operational FastAPI application for the root backend."""

from __future__ import annotations

import json
import os
import re
import sqlite3
import zipfile
from io import BytesIO
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.parse import urlparse
from urllib.request import Request as UrlRequest, urlopen
from uuid import uuid4

from fastapi import FastAPI, Header, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from fastapi.exceptions import RequestValidationError

from .generation import (
    BulkRefinementRequest,
    BasicCard,
    CardCollectionPayload,
    ClozeCard,
    GeneratedCards,
    FlashcardGenerationError,
    FlashcardGenerationRequest,
    FlashcardGenerationResponse,
    generate_flashcards,
    RefinementRequest,
    refine_flashcard,
)

SERVICE_ID = "flashcard-generator-fastapi"
CORRELATION_HEADER = "X-Correlation-ID"
_CORRELATION_ID = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")


class HealthResponse(BaseModel):
    """Stable response contract for the backend health check."""

    status: str
    service: str
    correlation_id: str


class ErrorResponse(BaseModel):
    """Stable error envelope shared by product endpoints."""

    model_config = ConfigDict(extra="forbid")

    error: str
    message: str
    correlation_id: str


class DocumentPayload(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    mime_type: str = ""
    data: list[int] = Field(max_length=10_000_000)


def _correlation_id(value: str | None) -> str:
    if value and _CORRELATION_ID.fullmatch(value):
        return value
    return uuid4().hex


def create_app() -> FastAPI:
    """Create the operational FastAPI application."""

    app = FastAPI(
        title="Flashcard Generator Backend",
        description="Operational boundary for the Python backend.",
        version="0.1.0",
        servers=[{"url": "http://localhost:8000"}],
    )

    def database_path() -> str:
        return os.getenv("CARD_DB_PATH", "./data/flashcards.db")

    def ensure_database() -> None:
        path = database_path()
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        with sqlite3.connect(path) as database:
            database.executescript(
                """
                CREATE TABLE IF NOT EXISTS collections (
                  id TEXT PRIMARY KEY,
                  created_at TEXT NOT NULL,
                  updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS cards (
                  id TEXT NOT NULL,
                  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
                  type TEXT NOT NULL CHECK (type IN ('basic', 'cloze')),
                  front TEXT,
                  back TEXT,
                  text TEXT,
                  tags TEXT NOT NULL,
                  PRIMARY KEY (collection_id, id)
                );
                """
            )

    @app.middleware("http")
    async def correlation_middleware(request: Request, call_next):
        correlation_id = _correlation_id(request.headers.get(CORRELATION_HEADER))
        request.state.correlation_id = correlation_id
        try:
            response = await call_next(request)
        except Exception:
            response = JSONResponse(
                status_code=500,
                content=ErrorResponse(
                    error="internal_error",
                    message="The server could not complete the request.",
                    correlation_id=correlation_id,
                ).model_dump(),
            )
        response.headers[CORRELATION_HEADER] = correlation_id
        return response

    @app.get(
        "/health",
        response_model=HealthResponse,
        responses={
            200: {
                "headers": {
                    CORRELATION_HEADER: {"schema": {"type": "string"}}
                }
            },
            500: {
                "model": ErrorResponse,
                "headers": {
                    CORRELATION_HEADER: {"schema": {"type": "string"}}
                },
            },
        },
        summary="Check backend availability",
        response_description="The backend is available.",
    )
    async def health(
        request: Request,
        correlation_header: str | None = Header(
            default=None, alias=CORRELATION_HEADER
        ),
    ) -> HealthResponse:
        return HealthResponse(
            status="ok",
            service=SERVICE_ID,
            correlation_id=request.state.correlation_id,
        )

    @app.exception_handler(FlashcardGenerationError)
    async def generation_error(
        request: Request, error: FlashcardGenerationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=error.status_code,
            content=ErrorResponse(
                error=error.code,
                message=error.message,
                correlation_id=request.state.correlation_id,
            ).model_dump(),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error(
        request: Request, error: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=ErrorResponse(
                error="invalid_request",
                message="The request does not match the flashcard generation contract.",
                correlation_id=request.state.correlation_id,
            ).model_dump(),
        )

    @app.post(
        "/api/v1/flashcards/generate",
        response_model=FlashcardGenerationResponse,
        responses={
            200: {
                "headers": {
                    CORRELATION_HEADER: {"schema": {"type": "string"}}
                }
            },
            422: {
                "model": ErrorResponse,
                "headers": {
                    CORRELATION_HEADER: {"schema": {"type": "string"}}
                },
            },
            502: {
                "model": ErrorResponse,
                "headers": {
                    CORRELATION_HEADER: {"schema": {"type": "string"}}
                },
            },
        },
        summary="Generate validated flashcards",
    )
    async def generate(
        request: Request,
        payload: FlashcardGenerationRequest,
        correlation_header: str | None = Header(
            default=None, alias=CORRELATION_HEADER
        ),
    ):
        response = await generate_flashcards(payload)
        return FlashcardGenerationResponse(
            cards=response.cards,
            correlation_id=request.state.correlation_id,
        )

    @app.post(
        "/api/v1/flashcards/refine",
        response_model=BasicCard | ClozeCard,
        summary="Refine one flashcard",
    )
    async def refine(request: Request, payload: RefinementRequest):
        return await refine_flashcard(payload)

    @app.post(
        "/api/v1/flashcards/refine/bulk",
        response_model=list[BasicCard | ClozeCard],
        summary="Refine multiple flashcards",
    )
    async def refine_bulk(request: Request, payload: BulkRefinementRequest):
        refined = []
        for card in payload.cards:
            refined.append(
                await refine_flashcard(
                    RefinementRequest(card=card, instruction=payload.instruction)
                )
            )
        return refined

    @app.put("/api/v1/collections/{collection_id}", summary="Save a card collection")
    async def save_collection(collection_id: str, payload: CardCollectionPayload):
        ensure_database()
        now = datetime.now(timezone.utc).isoformat()
        with sqlite3.connect(database_path()) as database:
            database.execute(
                """INSERT INTO collections (id, created_at, updated_at)
                   VALUES (?, ?, ?)
                   ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at""",
                (collection_id, now, now),
            )
            database.execute("DELETE FROM cards WHERE collection_id = ?", (collection_id,))
            for card in payload.cards:
                database.execute(
                    """INSERT INTO cards
                       (id, collection_id, type, front, back, text, tags)
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (
                        card.id,
                        collection_id,
                        card.type,
                        getattr(card, "front", None),
                        getattr(card, "back", None),
                        getattr(card, "text", None),
                        json.dumps(card.tags),
                    ),
                )
            database.commit()
        return {"saved": True, "id": collection_id}

    @app.get(
        "/api/v1/collections/{collection_id}",
        response_model=CardCollectionPayload | None,
        summary="Load a card collection",
    )
    async def load_collection(collection_id: str):
        ensure_database()
        with sqlite3.connect(database_path()) as database:
            rows = database.execute(
                """SELECT id, type, front, back, text, tags
                   FROM cards WHERE collection_id = ? ORDER BY rowid""",
                (collection_id,),
            ).fetchall()
        if not rows:
            return None
        cards = []
        for card_id, card_type, front, back, text, tags in rows:
            cards.append(
                {
                    "id": card_id,
                    "type": card_type,
                    **({"front": front or "", "back": back or ""} if card_type == "basic"
                       else {"text": text or ""}),
                    "tags": json.loads(tags),
                }
            )
        return CardCollectionPayload(cards=cards)

    @app.get("/api/v1/collections", summary="List card collections")
    async def list_collections():
        ensure_database()
        with sqlite3.connect(database_path()) as database:
            rows = database.execute(
                """SELECT c.id, c.updated_at, COUNT(cards.id)
                   FROM collections c
                   LEFT JOIN cards ON cards.collection_id = c.id
                   GROUP BY c.id
                   ORDER BY c.updated_at DESC"""
            ).fetchall()
        return [
            {"id": row[0], "updated_at": row[1], "card_count": row[2]}
            for row in rows
        ]

    @app.post("/api/v1/collections", summary="Create a card collection")
    async def create_collection(payload: dict | None = None):
        ensure_database()
        name = ((payload or {}).get("name") or "").strip()
        collection_id = name if name else uuid4().hex[:8]
        now = datetime.now(timezone.utc).isoformat()
        try:
            with sqlite3.connect(database_path()) as database:
                database.execute(
                    """INSERT INTO collections (id, created_at, updated_at)
                       VALUES (?, ?, ?)""",
                    (collection_id, now, now),
                )
                database.commit()
        except sqlite3.IntegrityError as error:
            raise FlashcardGenerationError(
                "duplicate_collection",
                "A collection with that name already exists.",
                409,
            ) from error
        return {"id": collection_id}

    @app.delete(
        "/api/v1/collections/{collection_id}", summary="Delete a card collection"
    )
    async def delete_collection(collection_id: str):
        ensure_database()
        with sqlite3.connect(database_path()) as database:
            database.execute(
                "DELETE FROM collections WHERE id = ?", (collection_id,)
            )
            database.commit()
        return {"deleted": True, "id": collection_id}

    @app.post("/api/v1/sources/url", summary="Extract readable text from a URL")
    async def extract_url(payload: dict[str, str]):
        value = payload.get("url", "").strip()
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            raise FlashcardGenerationError("invalid_url", "Enter a valid web page URL.", 422)
        hostname = parsed.hostname.lower()
        if (
            hostname in {"localhost", "127.0.0.1", "::1"}
            or hostname.startswith(("10.", "192.168.", "169.254."))
            or hostname.endswith(".local")
        ):
            raise FlashcardGenerationError(
                "invalid_url", "Local and private network URLs are not supported.", 422
            )
        try:
            request = UrlRequest(value, headers={"Accept": "text/html,application/xhtml+xml"})
            with urlopen(request, timeout=10) as response:
                content_type = response.headers.get("content-type", "")
                if "text/html" not in content_type and "application/xhtml" not in content_type:
                    raise FlashcardGenerationError(
                        "invalid_url", "The URL did not return an HTML page.", 422
                    )
                html = response.read(2_000_001).decode("utf-8", errors="replace")
        except FlashcardGenerationError:
            raise
        except Exception as error:
            raise FlashcardGenerationError(
                "source_fetch_failure", "Could not fetch the page.", 502
            ) from error
        if len(html) > 2_000_000:
            raise FlashcardGenerationError(
                "invalid_url", "Fetched pages must be 2,000,000 characters or smaller.", 422
            )

        class TextParser(HTMLParser):
            def __init__(self):
                super().__init__()
                self.parts: list[str] = []
                self.skip = 0

            def handle_starttag(self, tag, attrs):
                if tag in {"script", "style"}:
                    self.skip += 1

            def handle_endtag(self, tag):
                if tag in {"script", "style"} and self.skip:
                    self.skip -= 1

            def handle_data(self, data):
                if not self.skip:
                    self.parts.append(data)

        parser = TextParser()
        parser.feed(html)
        text = " ".join(" ".join(parser.parts).split())
        if not text:
            raise FlashcardGenerationError(
                "invalid_url", "The page did not contain readable text.", 422
            )
        return {"text": text}

    @app.post("/api/v1/sources/document", summary="Extract text from a document")
    async def extract_document(payload: DocumentPayload):
        if len(payload.data) > 10_000_000:
            raise FlashcardGenerationError(
                "invalid_document", "Files must be 10,000,000 bytes or smaller.", 422
            )
        raw = bytes(payload.data)
        extension = payload.name.rsplit(".", 1)[-1].lower() if "." in payload.name else ""
        try:
            if payload.mime_type in {"text/plain", "text/markdown"} or extension in {"txt", "md"}:
                text = raw.decode("utf-8")
            elif extension == "docx":
                with zipfile.ZipFile(BytesIO(raw)) as archive:
                    xml = archive.read("word/document.xml").decode("utf-8")
                text = re.sub(r"<[^>]+>", " ", xml)
            elif extension == "pdf" or payload.mime_type == "application/pdf":
                text = " ".join(
                    match.decode("utf-8", errors="ignore")
                    for match in re.findall(rb"\(([^\(\)]+)\)", raw)
                )
            else:
                raise FlashcardGenerationError(
                    "invalid_document",
                    f"Unsupported document type for {payload.name}.",
                    422,
                )
        except FlashcardGenerationError:
            raise
        except Exception as error:
            raise FlashcardGenerationError(
                "invalid_document",
                f"Could not extract readable text from {payload.name}.",
                422,
            ) from error
        text = " ".join(text.replace("\r\n", "\n").split()).strip()
        if not text:
            raise FlashcardGenerationError(
                "invalid_document", "The document did not contain readable text.", 422
            )
        return {"text": text}

    return app


app = create_app()

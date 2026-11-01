"""Operational FastAPI application for the root backend."""

from __future__ import annotations

import re
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

SERVICE_ID = "flashcard-generator-fastapi"
CORRELATION_HEADER = "X-Correlation-ID"
_CORRELATION_ID = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")


class HealthResponse(BaseModel):
    """Stable response contract for the backend health check."""

    status: str
    service: str
    correlation_id: str


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
                content={"detail": "Internal server error"},
            )
        response.headers[CORRELATION_HEADER] = correlation_id
        return response

    @app.get(
        "/health",
        response_model=HealthResponse,
        summary="Check backend availability",
        response_description="The backend is available.",
    )
    async def health(request: Request) -> HealthResponse:
        return HealthResponse(
            status="ok",
            service=SERVICE_ID,
            correlation_id=request.state.correlation_id,
        )

    return app


app = create_app()

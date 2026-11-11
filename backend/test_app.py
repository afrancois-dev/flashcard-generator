from fastapi import Request
from fastapi.testclient import TestClient
from pydantic_ai.models.test import TestModel

from backend.app import CORRELATION_HEADER, SERVICE_ID, app, create_app
from backend.generation import flashcard_generation_agent


client = TestClient(app)


def test_health_returns_documented_contract_and_echoes_correlation_id():
    response = client.get("/health", headers={CORRELATION_HEADER: "test-request-42"})

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": SERVICE_ID,
        "correlation_id": "test-request-42",
    }
    assert response.headers[CORRELATION_HEADER] == "test-request-42"


def test_health_generates_a_correlation_id_when_header_is_absent():
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == SERVICE_ID
    assert body["correlation_id"] == response.headers[CORRELATION_HEADER]
    assert len(body["correlation_id"]) == 32


def test_invalid_correlation_id_is_replaced():
    response = client.get("/health", headers={CORRELATION_HEADER: "not valid"})

    assert response.status_code == 200
    assert response.json()["correlation_id"] != "not valid"


def test_unhandled_failure_returns_documented_error_and_correlation_id():
    failing_app = create_app()

    @failing_app.get("/test-error")
    async def test_error(request: Request):
        raise RuntimeError("unexpected failure")

    response = TestClient(failing_app, raise_server_exceptions=False).get(
        "/test-error",
        headers={CORRELATION_HEADER: "test-request-500"},
    )

    assert response.status_code == 500
    assert response.json() == {
        "error": "internal_error",
        "message": "The server could not complete the request.",
        "correlation_id": "test-request-500",
    }
    assert response.headers[CORRELATION_HEADER] == "test-request-500"


def test_generate_basic_cards_with_mocked_pydantic_ai_model(monkeypatch):
    model = TestModel(
        custom_output_args={
            "cards": [
                {
                    "id": "basic-1",
                    "type": "basic",
                    "front": "What is testing?",
                    "back": "Checking behavior against expectations.",
                    "tags": ["testing"],
                }
            ]
        }
    )
    monkeypatch.setattr("backend.generation._agent_model", lambda: model)
    response = client.post(
        "/api/v1/flashcards/generate",
        headers={CORRELATION_HEADER: "basic-request"},
        json={
            "source_text": "Testing checks behavior.",
            "card_types": ["basic"],
            "requested_count": 1,
        },
    )

    assert response.status_code == 200
    assert response.json()["cards"][0]["type"] == "basic"
    assert response.json()["correlation_id"] == "basic-request"
    assert response.headers[CORRELATION_HEADER] == "basic-request"


def test_generate_cloze_cards_with_mocked_pydantic_ai_model(monkeypatch):
    model = TestModel(
        custom_output_args={
            "cards": [
                {
                    "id": "cloze-1",
                    "type": "cloze",
                    "text": "The {{c1::sun}} is a star.",
                    "tags": ["science"],
                }
            ]
        }
    )
    monkeypatch.setattr("backend.generation._agent_model", lambda: model)
    response = client.post(
        "/api/v1/flashcards/generate",
        json={
            "source_text": "The sun is a star.",
            "card_types": ["cloze"],
            "requested_count": 1,
        },
    )

    assert response.status_code == 200
    assert response.json()["cards"][0]["type"] == "cloze"
    assert response.headers[CORRELATION_HEADER] == response.json()["correlation_id"]


def test_generate_rejects_empty_input_with_stable_error_and_correlation_id():
    response = client.post(
        "/api/v1/flashcards/generate",
        headers={CORRELATION_HEADER: "empty-request"},
        json={"source_text": "   ", "card_types": ["basic"], "requested_count": 1},
    )

    assert response.status_code == 422
    assert response.json()["error"] == "invalid_request"
    assert response.json()["correlation_id"] == "empty-request"
    assert response.headers[CORRELATION_HEADER] == "empty-request"


def test_generate_rejects_coerced_requested_count():
    response = client.post(
        "/api/v1/flashcards/generate",
        headers={CORRELATION_HEADER: "strict-request"},
        json={
            "source_text": "A source.",
            "card_types": ["basic"],
            "requested_count": "1",
        },
    )

    assert response.status_code == 422
    assert response.json()["error"] == "invalid_request"
    assert response.json()["correlation_id"] == "strict-request"


def test_generate_rejects_invalid_structured_model_output(monkeypatch):
    model = TestModel(
        custom_output_args={
            "cards": [
                {
                    "id": "bad-1",
                    "type": "cloze",
                    "text": "No deletion here.",
                    "tags": [],
                }
            ]
        }
    )
    monkeypatch.setattr("backend.generation._agent_model", lambda: model)
    response = client.post(
        "/api/v1/flashcards/generate",
        json={
            "source_text": "A source.",
            "card_types": ["cloze"],
            "requested_count": 1,
        },
    )

    assert response.status_code == 502
    assert response.json()["error"] == "invalid_model_output"


def test_generate_returns_provider_failure_without_credentials(monkeypatch):
    async def fail(*args, **kwargs):
        raise RuntimeError("mock provider failure")

    monkeypatch.setattr(flashcard_generation_agent, "run", fail)
    response = client.post(
        "/api/v1/flashcards/generate",
        headers={CORRELATION_HEADER: "provider-request"},
        json={
            "source_text": "A source.",
            "card_types": ["basic"],
            "requested_count": 1,
        },
    )

    assert response.status_code == 502
    assert response.json() == {
        "error": "provider_failure",
        "message": "The flashcard provider could not generate cards.",
        "correlation_id": "provider-request",
    }


def test_collection_persistence_is_owned_by_fastapi(monkeypatch, tmp_path):
    monkeypatch.setenv("CARD_DB_PATH", str(tmp_path / "cards.db"))
    card = {
        "id": "card-1",
        "type": "basic",
        "front": "Question",
        "back": "Answer",
        "tags": ["test"],
    }

    saved = client.put(
        "/api/v1/collections/default",
        json={"cards": [card]},
    )
    loaded = client.get("/api/v1/collections/default")

    assert saved.status_code == 200
    assert saved.json() == {"saved": True, "id": "default"}
    assert loaded.status_code == 200
    assert loaded.json() == {"cards": [card]}


def test_document_extraction_is_owned_by_fastapi():
    response = client.post(
        "/api/v1/sources/document",
        json={
            "name": "notes.txt",
            "mime_type": "text/plain",
            "data": list(b"FastAPI owns extraction."),
        },
    )

    assert response.status_code == 200
    assert response.json() == {"text": "FastAPI owns extraction."}

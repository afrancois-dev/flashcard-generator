from fastapi import Request
from fastapi.testclient import TestClient

from backend.app import CORRELATION_HEADER, SERVICE_ID, app, create_app


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
    assert response.json() == {"detail": "Internal server error"}
    assert response.headers[CORRELATION_HEADER] == "test-request-500"

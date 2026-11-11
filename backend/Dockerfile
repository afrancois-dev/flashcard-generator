FROM python:3.12-slim

WORKDIR /app
COPY backend/pyproject.toml backend/
COPY backend/*.py backend/
RUN pip install --no-cache-dir ./backend

ENV CARD_DB_PATH=/app/data/flashcards.db
RUN mkdir -p /app/data
EXPOSE 8000
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]

.PHONY: dev frontend backend install test lint build examples
dev:
	docker compose up --build
install:
	cd frontend && npm ci
	cd backend && uv sync --locked
frontend:
	cd frontend && npm run dev
backend:
	cd backend && uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
test:
	cd frontend && npm test
	cd backend && uv run pytest -q
lint:
	cd frontend && npm run lint
	cd backend && uv run ruff check app tests examples
build:
	cd frontend && npm run build
examples:
	cd backend && uv run python -m examples.run_examples

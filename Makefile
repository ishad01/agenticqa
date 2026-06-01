.PHONY: install backend frontend dev typecheck

install:
	cd backend && python3 -m venv .venv && . .venv/bin/activate && pip install -e .
	cd frontend && npm install

backend:
	cd backend && . .venv/bin/activate && uvicorn agenticqa.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

dev:
	@echo "Run 'make backend' and 'make frontend' in two terminals."

typecheck:
	cd frontend && npm run typecheck

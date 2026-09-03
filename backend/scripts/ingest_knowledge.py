"""
One-off (rerunnable) script: ingest knowledge_docs/ into the RAG store.

Run:  python scripts/ingest_knowledge.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))  # make `app` importable

import app.models  # noqa: E402,F401  — registers ALL models so string relationships resolve

from app.database.session import SessionLocal  # noqa: E402
from app.services.rag_service import ingest_documents  # noqa: E402


def main() -> None:
    docs_dir = Path(__file__).resolve().parents[1] / "knowledge_docs"
    if not docs_dir.exists():
        print(f"ERROR: {docs_dir} not found — create it and add your .md docs first.")
        return

    db = SessionLocal()
    try:
        n = ingest_documents(db, docs_dir)
        print(f"✅ Ingested {n} document(s) from {docs_dir}")
    finally:
        db.close()


if __name__ == "__main__":
    main()

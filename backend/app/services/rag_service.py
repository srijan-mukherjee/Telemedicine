"""
Phase 9 — RAG service.

Part 1 (this file): local embeddings + knowledge ingestion + retrieval.
Part 2 (ai_chat_service): conversation orchestration + Groq call.
"""

import json
from pathlib import Path

from pgvector.sqlalchemy import Vector
from sentence_transformers import SentenceTransformer
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.ai_chat import DocumentChunk, KnowledgeDocument

settings = get_settings()

# Loaded once per process (model download ~90MB on very first run)
_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(settings.embedding_model)
    return _model


def embed_text(text_input: str) -> list[float]:
    """Embed a single string; returns a 384-dim float list."""
    return _get_model().encode(text_input, normalize_embeddings=True).tolist()


def chunk_content(content: str, chunk_size: int = 900, overlap: int = 150) -> list[str]:
    """
    Split a document into overlapping chunks on paragraph boundaries,
    falling back to hard cuts for very long paragraphs.
    """
    paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
    chunks: list[str] = []
    current = ""
    for para in paragraphs:
        if len(current) + len(para) + 2 <= chunk_size:
            current = f"{current}\n\n{para}" if current else para
            continue
        if current:
            chunks.append(current)
        while len(para) > chunk_size:            # hard-cut oversized paragraphs
            chunks.append(para[:chunk_size])
            para = para[chunk_size - overlap:]
        current = para
    if current:
        chunks.append(current)
    return chunks


def ingest_documents(db: Session, docs_dir: Path) -> int:
    """
    Ingest all .md/.txt files from knowledge_docs/.
    Re-running is safe: a document with the same source_filename is
    replaced (old chunks cascade-deleted).
    Returns number of documents ingested.
    """
    model = _get_model()
    count = 0

    for path in sorted(docs_dir.glob("*.md")) + sorted(docs_dir.glob("*.txt")):
        content = path.read_text(encoding="utf-8")
        if not content.strip():
            continue

        # first markdown heading = title; specialty hint from a line like
        # "Specialty: Cardiology" if present, else None
        title = path.stem.replace("_", " ")
        for line in content.splitlines():
            if line.startswith("# "):
                title = line[2:].strip()
                break
        specialty_hint = None
        for line in content.splitlines():
            if line.lower().startswith("specialty:"):
                specialty_hint = line.split(":", 1)[1].strip()
                break

        # replace if re-ingesting
        existing = db.query(KnowledgeDocument).filter(
            KnowledgeDocument.source_filename == path.name
        ).first()
        if existing:
            db.delete(existing)
            db.commit()

        doc = KnowledgeDocument(
            title=title,
            source_filename=path.name,
            specialty_hint=specialty_hint,
            content=content,
        )
        db.add(doc)
        db.flush()  # get doc.id

        for i, chunk_text in enumerate(chunk_content(content)):
            db.add(DocumentChunk(
                document_id=doc.id,
                chunk_index=i,
                content=chunk_text,
                embedding=embed_text(chunk_text),
            ))
        count += 1

    db.commit()
    return count


def retrieve_relevant_chunks(db: Session, query: str, top_k: int = 4) -> list[dict]:
    """
    Semantic search: embed the query, return top_k chunks by cosine
    similarity, each with its document title + specialty hint.
    """
    # pass as "[1,2,...]" string and CAST to vector inside SQL
    query_vec_str = "[" + ",".join(f"{x:.7f}" for x in embed_text(query)) + "]"
    rows = db.execute(
        text("""
            SELECT dc.id, dc.content, kd.title, kd.specialty_hint,
                   1 - (dc.embedding <=> CAST(:qvec AS vector)) AS similarity
            FROM document_chunks dc
            JOIN knowledge_documents kd ON kd.id = dc.document_id
            ORDER BY dc.embedding <=> CAST(:qvec AS vector)
            LIMIT :k
        """),
        {"qvec": query_vec_str, "k": top_k},
    ).mappings().all()

    return [
        {
            "id": r["id"],
            "content": r["content"],
            "title": r["title"],
            "specialty_hint": r["specialty_hint"],
            "similarity": float(r["similarity"]),
        }
        for r in rows
    ]

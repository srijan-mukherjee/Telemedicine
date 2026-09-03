"""
Phase 9 — AI Symptom Checker models.

ai_conversations / ai_messages: persistent chat history per patient.
knowledge_documents / document_chunks: RAG knowledge base. Chunks carry
a 384-dim embedding (all-MiniLM-L6-v2) searched via pgvector cosine
distance.
"""

from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.enums import UserRole


class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    title: Mapped[str | None] = mapped_column("title", type_=Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    messages = relationship(
        "AIMessage", back_populates="conversation", cascade="all, delete-orphan",
        order_by="AIMessage.id",
    )


class AIMessage(Base):
    __tablename__ = "ai_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("ai_conversations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    # "user" = patient's question, "assistant" = AI reply, "system" = triage/safety note
    role: Mapped[str] = mapped_column("role", type_=Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    # Structured AI output (urgency/specialty JSON) stored as text on assistant messages
    meta_json: Mapped[str | None] = mapped_column("meta_json", type_=Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    conversation = relationship("AIConversation", back_populates="messages")


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    source_filename: Mapped[str] = mapped_column(Text, nullable=False)
    specialty_hint: Mapped[str | None] = mapped_column(Text, nullable=True)  # e.g. "Cardiology"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    chunks = relationship(
        "DocumentChunk", back_populates="document", cascade="all, delete-orphan"
    )


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(
        ForeignKey("knowledge_documents.id", ondelete="CASCADE"), index=True, nullable=False
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding = mapped_column(Vector(384), nullable=False)  # all-MiniLM-L6-v2 = 384 dims
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    document = relationship("KnowledgeDocument", back_populates="chunks")


# pgvector cosine-similarity index (required for good search performance)
Index(
    "document_chunks_embedding_idx",
    DocumentChunk.embedding,
    postgresql_using="ivfflat",
    postgresql_ops={"embedding": "vector_cosine_ops"},
    postgresql_with={"lists": 100},
)

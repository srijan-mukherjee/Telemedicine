"""Prescription PDF rendering with reportlab."""

import io
from urllib.parse import quote

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from app.models.prescription import Prescription


def render_prescription_pdf(rx: Prescription, doctor_name: str, patient_name: str) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4

    # Header
    c.setFont("Helvetica-Bold", 18)
    c.drawString(20 * mm, h - 25 * mm, "Prescription")
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, h - 33 * mm, f"Reference: {rx.appointment.reference_number}")
    c.drawRightString(w - 20 * mm, h - 25 * mm, f"Date: {rx.created_at:%d %b %Y}")

    # Parties
    y = h - 45 * mm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(20 * mm, y, f"Doctor: {doctor_name}")
    c.drawString(20 * mm, y - 6 * mm, f"Patient: {patient_name}")

    c.line(20 * mm, y - 12 * mm, w - 20 * mm, y - 12 * mm)

    # Diagnosis
    y -= 20 * mm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(20 * mm, y, "Diagnosis:")
    c.setFont("Helvetica", 11)
    c.drawString(50 * mm, y, rx.diagnosis or "—")

    # Medicines table
    y -= 12 * mm
    c.setFont("Helvetica-Bold", 10)
    c.drawString(20 * mm, y, "Medicine")
    c.drawString(90 * mm, y, "Dosage")
    c.drawString(120 * mm, y, "Frequency")
    c.drawString(155 * mm, y, "Duration")
    y -= 2 * mm
    c.line(20 * mm, y, w - 20 * mm, y)
    y -= 7 * mm
    c.setFont("Helvetica", 10)
    for it in rx.items:
        if y < 50 * mm:
            c.showPage()
            y = h - 25 * mm
        c.drawString(20 * mm, y, it.medicine_name)
        c.drawString(90 * mm, y, it.dosage or "—")
        c.drawString(120 * mm, y, it.frequency or "—")
        c.drawString(155 * mm, y, f"{it.duration_days} days" if it.duration_days else "—")
        y -= 7 * mm

    # Advice / notes
    for label, value in (("Advice:", rx.advice), ("Notes:", rx.clinical_notes)):
        if value:
            if y < 45 * mm:
                c.showPage()
                y = h - 25 * mm
            y -= 10 * mm
            c.setFont("Helvetica-Bold", 10)
            c.drawString(20 * mm, y, label)
            c.setFont("Helvetica", 10)
            c.drawString(50 * mm, y, value)

    # Signature line
    c.setFont("Helvetica", 10)
    c.drawString(130 * mm, 25 * mm, "____________________")
    c.drawString(130 * mm, 20 * mm, "Doctor's signature")

    c.save()
    return buf.getvalue()


def pdf_response_filename(rx: Prescription) -> str:
    name = f"prescription_{rx.appointment.reference_number}.pdf"
    # ASCII fallback + RFC 5987 for the header
    return f"attachment; filename*=UTF-8''{quote(name)}"

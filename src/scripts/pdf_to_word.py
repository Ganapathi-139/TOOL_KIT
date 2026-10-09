"""
pdf_to_word.py – High-fidelity PDF → Word (.docx) conversion engine.

Architecture:
1. Native pdf2docx engine for digital PDFs (reconstructs paragraphs, tables, fonts, formatting, styles, and images).
2. RapidOCR ONNX integration for scanned/image-only PDFs (recognizes text from page bitmaps and constructs clean Word documents).
3. Text encoding & unicode ligature normalizer (cleans fi, fl, ff, quotes, and Private-Use Area artifacts).
4. Validation of input (existence, encryption check, corruption check) and output (.docx integrity verification).
"""

import sys
import os
import io
import re
import tempfile
import pymupdf as fitz
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def fix_text_encoding(text: str) -> str:
    """Normalizes PDF ligatures, smart quotes, and Unicode artifacts."""
    if not text:
        return ""
    replacements = {
        "\ufb01": "fi",
        "\ufb02": "fl",
        "\ufb00": "ff",
        "\ufb03": "ffi",
        "\ufb04": "ffl",
        "\u00a0": " ",
        "\u2019": "'",
        "\u2018": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2013": "-",
        "\u2014": "--",
        "\ufffd": "",
    }
    for bad, good in replacements.items():
        text = text.replace(bad, good)
    return text


def is_scanned_pdf(doc: fitz.Document) -> bool:
    """Checks if PDF is scanned or image-based (< 10 selectable words per page)."""
    if len(doc) == 0:
        return False
    total_words = sum(len(page.get_text("words")) for page in doc)
    return (total_words / len(doc)) < 10


def convert_scanned_pdf_with_ocr(pdf_path: str, docx_path: str):
    """Performs local OCR on scanned PDF pages using RapidOCR and builds an editable DOCX."""
    from rapidocr_onnxruntime import RapidOCR
    import numpy as np
    from PIL import Image

    ocr_engine = RapidOCR()
    doc = fitz.open(pdf_path)
    output_doc = docx.Document()

    for page_idx, page in enumerate(doc):
        if page_idx > 0:
            output_doc.add_page_break()

        # Render page at 200 DPI for high OCR accuracy
        pix = page.get_pixmap(dpi=200)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        img_np = np.array(img)

        ocr_results, _ = ocr_engine(img_np)

        if not ocr_results:
            p = output_doc.add_paragraph("[Page image without recognized text]")
            p.runs[0].font.italic = True
            continue

        # Sort recognized lines top-to-bottom
        lines = []
        for box, text, score in ocr_results:
            if not text or not text.strip():
                continue
            y_top = box[0][1]
            lines.append((y_top, fix_text_encoding(text.strip())))

        lines.sort(key=lambda x: x[0])

        for _, line_text in lines:
            output_doc.add_paragraph(line_text)

    doc.close()
    output_doc.save(docx_path)


def convert_digital_pdf(pdf_path: str, docx_path: str):
    """Converts digital PDF using the dedicated pdf2docx layout reconstruction engine."""
    from pdf2docx import Converter

    cv = Converter(pdf_path)
    cv.convert(
        docx_path,
        clip_image_res_ratio=4.0,
        float_image_ignorable_gap=2.0,
        page_margin_factor_top=0.3,
        page_margin_factor_bottom=0.3,
        ignore_page_error=True,
    )
    cv.close()

    # Post-process to fix any font encoding artifacts
    doc = docx.Document(docx_path)
    for para in doc.paragraphs:
        for run in para.runs:
            run.text = fix_text_encoding(run.text)
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for para in cell.paragraphs:
                    for run in para.runs:
                        run.text = fix_text_encoding(run.text)
    doc.save(docx_path)


def convert_pdf_to_docx(pdf_path: str, docx_path: str):
    """Main PDF to Word conversion entrypoint."""
    abs_pdf = os.path.abspath(pdf_path)
    abs_docx = os.path.abspath(docx_path)

    if not os.path.exists(abs_pdf):
        raise FileNotFoundError(f"Source PDF not found: {abs_pdf}")
    if os.path.getsize(abs_pdf) == 0:
        raise ValueError("Source PDF is empty (0 bytes).")

    doc = fitz.open(abs_pdf)
    if doc.is_encrypted:
        doc.close()
        raise PermissionError("This PDF is password-protected or encrypted. Please remove encryption before converting.")

    if len(doc) == 0:
        doc.close()
        raise ValueError("The PDF document contains 0 pages.")

    scanned = is_scanned_pdf(doc)
    doc.close()

    if scanned:
        convert_scanned_pdf_with_ocr(abs_pdf, abs_docx)
    else:
        convert_digital_pdf(abs_pdf, abs_docx)

    # Validate output
    if not os.path.exists(abs_docx) or os.path.getsize(abs_docx) == 0:
        raise RuntimeError("Generated DOCX document is missing or 0 bytes.")

    # Verify DOCX structure integrity
    try:
        test_doc = docx.Document(abs_docx)
    except Exception as e:
        raise RuntimeError(f"Generated DOCX document failed integrity verification: {e}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python pdf_to_word.py <input_pdf> <output_docx>")
        sys.exit(1)

    pdf_in = sys.argv[1]
    docx_out = sys.argv[2]

    try:
        convert_pdf_to_docx(pdf_in, docx_out)
        print("SUCCESS")
    except Exception as err:
        import traceback
        traceback.print_exc()
        print(f"ERROR: {err}", file=sys.stderr)
        sys.exit(1)

"""
pdf_to_ppt.py – PDF → PowerPoint (.pptx) conversion engine with reconstructed slide content.

Architecture:
1. Reconstructs slide geometry matching source PDF page dimensions.
2. Extracts and embeds all images as native PowerPoint Picture shapes at exact bounding box coordinates.
3. Reconstructs all text lines/paragraphs as native, visible, editable PowerPoint Text Boxes
   with font sizes, font colors, bold/italic attributes, and positions.
4. Preserves vector graphics & page decorations (borders, certificate frames, background art)
   by isolating non-text background elements, preventing duplicate text while maintaining full visual layout.
5. Employs RapidOCR for scanned/raster PDF pages to extract editable text boxes.
"""

import sys
import os
import io
import pymupdf as fitz
from pptx import Presentation
from pptx.util import Pt
from pptx.dml.color import RGBColor


def _pt_to_emu(pt_val: float) -> int:
    """Converts typographic points to OpenXML EMU (1 pt = 12700 EMU)."""
    return int(pt_val * 12700)


def fix_text_encoding(text: str) -> str:
    """Cleans common font ligatures and replacement characters."""
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


def convert_pdf_to_pptx(pdf_path: str, pptx_path: str):
    abs_pdf = os.path.abspath(pdf_path)
    abs_pptx = os.path.abspath(pptx_path)

    if not os.path.exists(abs_pdf):
        raise FileNotFoundError(f"Source PDF not found: {abs_pdf}")
    if os.path.getsize(abs_pdf) == 0:
        raise ValueError("Source PDF is empty (0 bytes).")

    doc = fitz.open(abs_pdf)
    if doc.is_encrypted:
        doc.close()
        raise PermissionError("This PDF is password-protected. Please remove encryption before converting.")

    if len(doc) == 0:
        doc.close()
        raise ValueError("The PDF document contains 0 pages.")

    prs = Presentation()
    first_page = doc[0]
    prs.slide_width = _pt_to_emu(first_page.rect.width)
    prs.slide_height = _pt_to_emu(first_page.rect.height)
    blank_layout = prs.slide_layouts[6]

    temp_files = []

    try:
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            slide = prs.slides.add_slide(blank_layout)

            # Check if page has vector drawings/borders
            drawings = page.get_drawings()
            has_vector_art = len(drawings) > 0

            # ── 1. If vector graphics exist, extract background artwork with text redacted ──
            if has_vector_art:
                doc_bg = fitz.open(abs_pdf)
                page_bg = doc_bg[page_idx]

                # Redact text blocks from background image to avoid text duplication
                text_blocks = page.get_text("blocks")
                for b in text_blocks:
                    if len(b) >= 5 and b[4].strip():
                        page_bg.add_redact_annot(fitz.Rect(b[:4]), fill=None)

                page_bg.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)
                bg_pix = page_bg.get_pixmap(dpi=150)
                temp_bg = f"{abs_pptx}_bg_{page_idx}.png"
                bg_pix.save(temp_bg)
                temp_files.append(temp_bg)
                doc_bg.close()

                slide.shapes.add_picture(
                    temp_bg,
                    left=0,
                    top=0,
                    width=prs.slide_width,
                    height=prs.slide_height,
                )

            # ── 2. Add native raster images at their bounding box coordinates ──────────
            processed_xrefs = set()
            for img_info in page.get_images():
                xref = img_info[0]
                if xref in processed_xrefs:
                    continue
                processed_xrefs.add(xref)

                rects = page.get_image_rects(xref)
                if not rects:
                    continue

                img_data = doc.extract_image(xref)
                if not img_data or not img_data.get("image"):
                    continue

                for r in rects:
                    # Avoid adding images that cover the entire page if vector background was already added
                    if has_vector_art and r.width >= page.rect.width * 0.95 and r.height >= page.rect.height * 0.95:
                        continue

                    img_stream = io.BytesIO(img_data["image"])
                    try:
                        slide.shapes.add_picture(
                            img_stream,
                            left=_pt_to_emu(r.x0),
                            top=_pt_to_emu(r.y0),
                            width=_pt_to_emu(r.width),
                            height=_pt_to_emu(r.height),
                        )
                    except Exception:
                        pass

            # ── 3. Reconstruct native editable text boxes ─────────────────────────────
            text_dict = page.get_text("dict")
            blocks = text_dict.get("blocks", [])
            text_blocks_count = 0

            for block in blocks:
                if block.get("type") != 0:  # skip non-text
                    continue

                bbox = block.get("bbox", [0, 0, 100, 30])
                lines = block.get("lines", [])
                if not lines:
                    continue

                left = _pt_to_emu(bbox[0])
                top = _pt_to_emu(bbox[1])
                width = _pt_to_emu(max(bbox[2] - bbox[0], 20))
                height = _pt_to_emu(max(bbox[3] - bbox[1], 15))

                # Constrain within slide bounds
                left = max(0, min(left, prs.slide_width - width))
                top = max(0, min(top, prs.slide_height - height))

                tb = slide.shapes.add_textbox(left, top, width, height)
                tf = tb.text_frame
                tf.word_wrap = True
                tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

                para_idx = 0
                for line in lines:
                    spans = line.get("spans", [])
                    line_text = "".join(s.get("text", "") for s in spans).strip()
                    if not line_text:
                        continue

                    p = tf.paragraphs[0] if para_idx == 0 else tf.add_paragraph()
                    para_idx += 1

                    for span in spans:
                        raw_t = span.get("text", "")
                        clean_t = fix_text_encoding(raw_t)
                        if not clean_t:
                            continue

                        run = p.add_run()
                        run.text = clean_t

                        size = span.get("size", 12)
                        run.font.size = Pt(max(size, 8))

                        # Color extraction
                        color_int = span.get("color", 0)
                        red = (color_int >> 16) & 255
                        green = (color_int >> 8) & 255
                        blue = color_int & 255
                        run.font.color.rgb = RGBColor(red, green, blue)

                        # Flags: bit 1 = italic, bit 2 = bold
                        flags = span.get("flags", 0)
                        if flags & 2:
                            run.font.bold = True
                        if flags & 1:
                            run.font.italic = True

                if para_idx > 0:
                    text_blocks_count += 1

            # ── 4. Scanned PDF fallback via RapidOCR if no text was found ──────────────
            if text_blocks_count == 0:
                try:
                    from rapidocr_onnxruntime import RapidOCR
                    import numpy as np
                    from PIL import Image

                    ocr_engine = RapidOCR()
                    pix = page.get_pixmap(dpi=150)
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    ocr_results, _ = ocr_engine(np.array(img))

                    if ocr_results:
                        scale_x = page.rect.width / pix.width
                        scale_y = page.rect.height / pix.height

                        for box, text, score in ocr_results:
                            if not text or not text.strip():
                                continue
                            clean_t = fix_text_encoding(text.strip())
                            x0 = box[0][0] * scale_x
                            y0 = box[0][1] * scale_y
                            x1 = box[2][0] * scale_x
                            y1 = box[2][1] * scale_y

                            left = _pt_to_emu(x0)
                            top = _pt_to_emu(y0)
                            width = _pt_to_emu(max(x1 - x0, 20))
                            height = _pt_to_emu(max(y1 - y0, 15))

                            tb = slide.shapes.add_textbox(left, top, width, height)
                            tf = tb.text_frame
                            tf.word_wrap = True
                            p = tf.paragraphs[0]
                            run = p.add_run()
                            run.text = clean_t
                            run.font.size = Pt(11)
                            run.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
                except Exception as ocr_err:
                    print(f"[DEBUG] OCR failed on page {page_idx}: {ocr_err}", file=sys.stderr)

        prs.save(abs_pptx)
    finally:
        doc.close()
        for f in temp_files:
            if os.path.exists(f):
                try:
                    os.remove(f)
                except Exception:
                    pass

    # Verify output PPTX
    if not os.path.exists(abs_pptx) or os.path.getsize(abs_pptx) == 0:
        raise RuntimeError("Generated PowerPoint presentation is missing or 0 bytes.")

    try:
        test_prs = Presentation(abs_pptx)
        if len(test_prs.slides) == 0:
            raise RuntimeError("Generated PowerPoint presentation contains 0 slides.")
    except Exception as e:
        raise RuntimeError(f"Generated PowerPoint presentation failed verification: {e}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python pdf_to_ppt.py <input_pdf> <output_pptx>")
        sys.exit(1)

    pdf_in = sys.argv[1]
    pptx_out = sys.argv[2]

    try:
        convert_pdf_to_pptx(pdf_in, pptx_out)
        print("SUCCESS")
    except Exception as err:
        import traceback
        traceback.print_exc()
        print(f"ERROR: {err}", file=sys.stderr)
        sys.exit(1)

"""
word_to_pdf.py – DOCX → PDF conversion engine using native document rendering engines.

Supported Engines:
1. LibreOffice Headless (soffice --headless --convert-to pdf) - Cross-platform, Linux/Windows/macOS.
2. Microsoft Word Automation (via Windows COM / docx2pdf) - High-fidelity native rendering on Windows.

Strict Policy:
- No low-quality text extraction or pseudo-PDF substitutions.
- Full layout, font, table, vector, and image preservation.
- Full output PDF validation before completion.
"""

import sys
import os
import shutil
import subprocess
import tempfile
import pymupdf as fitz


def find_libreoffice_binary() -> str | None:
    """Finds soffice or libreoffice executable on the system."""
    for cmd in ["soffice", "libreoffice"]:
        path = shutil.which(cmd)
        if path:
            return path

    # Check common Windows installation paths
    common_paths = [
        r"C:\Program Files\LibreOffice\program\soffice.exe",
        r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
    ]
    for p in common_paths:
        if os.path.exists(p):
            return p

    return None


def convert_with_libreoffice(docx_path: str, pdf_path: str, soffice_path: str) -> bool:
    """Converts DOCX to PDF using LibreOffice in headless mode."""
    out_dir = os.path.dirname(os.path.abspath(pdf_path))
    cmd = [
        soffice_path,
        "--headless",
        "--convert-to",
        "pdf",
        "--outdir",
        out_dir,
        os.path.abspath(docx_path),
    ]

    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
    expected_out = os.path.join(
        out_dir,
        os.path.splitext(os.path.basename(docx_path))[0] + ".pdf"
    )

    if os.path.exists(expected_out):
        if os.path.abspath(expected_out) != os.path.abspath(pdf_path):
            shutil.move(expected_out, pdf_path)
        return os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0
    return False


def convert_with_msword_com(docx_path: str, pdf_path: str) -> bool:
    """Converts DOCX to PDF using Microsoft Word COM automation (Windows)."""
    abs_docx = os.path.abspath(docx_path)
    abs_pdf = os.path.abspath(pdf_path)

    try:
        import win32com.client
        import pythoncom
        pythoncom.CoInitialize()

        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        word.DisplayAlerts = False
        word.AutomationSecurity = 3  # msoAutomationSecurityForceDisable
        doc = None
        try:
            doc = word.Documents.Open(abs_docx, ReadOnly=True, ConfirmConversions=False)
            # 17 = wdExportFormatPDF
            doc.SaveAs2(abs_pdf, FileFormat=17)
            doc.Close(SaveChanges=False)
            doc = None
        finally:
            if doc is not None:
                try:
                    doc.Close(SaveChanges=False)
                except Exception:
                    pass
            word.Quit()
            pythoncom.CoUninitialize()

        return os.path.exists(abs_pdf) and os.path.getsize(abs_pdf) > 0
    except Exception as e:
        print(f"[DEBUG] MS Word COM failed: {e}", file=sys.stderr)
        return False


def convert_docx_to_pdf(docx_path: str, pdf_path: str):
    """Main DOCX to PDF entrypoint."""
    abs_docx = os.path.abspath(docx_path)
    abs_pdf = os.path.abspath(pdf_path)

    if not os.path.exists(abs_docx):
        raise FileNotFoundError(f"Source Word document not found: {abs_docx}")
    if os.path.getsize(abs_docx) == 0:
        raise ValueError("Source Word document is empty (0 bytes).")

    # 1. Try LibreOffice headless
    soffice = find_libreoffice_binary()
    if soffice:
        if convert_with_libreoffice(abs_docx, abs_pdf, soffice):
            verify_pdf_output(abs_pdf)
            return

    # 2. Try Microsoft Word COM (on Windows)
    if os.name == "nt":
        if convert_with_msword_com(abs_docx, abs_pdf):
            verify_pdf_output(abs_pdf)
            return

    # 3. Neither is available
    raise RuntimeError(
        "No supported document rendering engine available. "
        "Word-to-PDF conversion requires LibreOffice (headless) or Microsoft Word to be installed on the system."
    )


def verify_pdf_output(pdf_path: str):
    """Verifies that the generated PDF is valid, readable, and non-empty."""
    if not os.path.exists(pdf_path) or os.path.getsize(pdf_path) == 0:
        raise RuntimeError("PDF generation failed: Output file is missing or empty.")

    try:
        doc = fitz.open(pdf_path)
        if len(doc) == 0:
            doc.close()
            raise RuntimeError("Generated PDF has 0 pages.")
        doc.close()
    except Exception as e:
        raise RuntimeError(f"Generated PDF failed structural verification: {e}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python word_to_pdf.py <input_docx> <output_pdf>")
        sys.exit(1)

    docx_in = sys.argv[1]
    pdf_out = sys.argv[2]

    try:
        convert_docx_to_pdf(docx_in, pdf_out)
        print("SUCCESS")
    except Exception as err:
        import traceback
        traceback.print_exc()
        print(f"ERROR: {err}", file=sys.stderr)
        sys.exit(1)

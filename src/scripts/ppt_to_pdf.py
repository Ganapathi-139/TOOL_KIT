"""
ppt_to_pdf.py – PPTX/PPT → PDF conversion engine using native presentation rendering engines.

Supported Engines:
1. LibreOffice Headless (soffice --headless --convert-to pdf) - Cross-platform presentation renderer.
2. Microsoft PowerPoint Automation (via Windows COM / win32com) - Native PowerPoint export on Windows.

Strict Policy:
- No low-quality screenshot fallbacks.
- Full vector shapes, slides, animations-flattened layout, fonts, and graphics preservation.
- Full output PDF validation before completion.
"""

import sys
import os
import shutil
import subprocess
import pymupdf as fitz


def find_libreoffice_binary() -> str | None:
    """Finds soffice or libreoffice executable on the system."""
    for cmd in ["soffice", "libreoffice"]:
        path = shutil.which(cmd)
        if path:
            return path

    common_paths = [
        r"C:\Program Files\LibreOffice\program\soffice.exe",
        r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
    ]
    for p in common_paths:
        if os.path.exists(p):
            return p

    return None


def convert_with_libreoffice(ppt_path: str, pdf_path: str, soffice_path: str) -> bool:
    """Converts PPT/PPTX to PDF using LibreOffice in headless mode."""
    out_dir = os.path.dirname(os.path.abspath(pdf_path))
    cmd = [
        soffice_path,
        "--headless",
        "--convert-to",
        "pdf",
        "--outdir",
        out_dir,
        os.path.abspath(ppt_path),
    ]

    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
    expected_out = os.path.join(
        out_dir,
        os.path.splitext(os.path.basename(ppt_path))[0] + ".pdf"
    )

    if os.path.exists(expected_out):
        if os.path.abspath(expected_out) != os.path.abspath(pdf_path):
            shutil.move(expected_out, pdf_path)
        return os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0
    return False


def convert_with_powerpoint_com(ppt_path: str, pdf_path: str) -> bool:
    """Converts PPT/PPTX to PDF using Microsoft PowerPoint COM automation (Windows)."""
    abs_ppt = os.path.abspath(ppt_path)
    abs_pdf = os.path.abspath(pdf_path)

    try:
        import win32com.client
        import pythoncom
        pythoncom.CoInitialize()

        powerpoint = win32com.client.Dispatch("PowerPoint.Application")
        powerpoint.DisplayAlerts = False
        powerpoint.AutomationSecurity = 3  # msoAutomationSecurityForceDisable
        deck = None
        try:
            deck = powerpoint.Presentations.Open(abs_ppt, WithWindow=False)
            # 32 = ppSaveAsPDF
            deck.SaveAs(abs_pdf, 32)
            deck.Close()
            deck = None
        finally:
            if deck is not None:
                try:
                    deck.Close()
                except Exception:
                    pass
            powerpoint.Quit()
            pythoncom.CoUninitialize()

        return os.path.exists(abs_pdf) and os.path.getsize(abs_pdf) > 0
    except Exception as e:
        print(f"[DEBUG] PowerPoint COM failed: {e}", file=sys.stderr)
        return False


def convert_ppt_to_pdf(ppt_path: str, pdf_path: str):
    """Main PPT to PDF entrypoint."""
    abs_ppt = os.path.abspath(ppt_path)
    abs_pdf = os.path.abspath(pdf_path)

    if not os.path.exists(abs_ppt):
        raise FileNotFoundError(f"Source presentation not found: {abs_ppt}")
    if os.path.getsize(abs_ppt) == 0:
        raise ValueError("Source presentation is empty (0 bytes).")

    # 1. Try LibreOffice headless
    soffice = find_libreoffice_binary()
    if soffice:
        if convert_with_libreoffice(abs_ppt, abs_pdf, soffice):
            verify_pdf_output(abs_pdf)
            return

    # 2. Try Microsoft PowerPoint COM (Windows)
    if os.name == "nt":
        if convert_with_powerpoint_com(abs_ppt, abs_pdf):
            verify_pdf_output(abs_pdf)
            return

    # 3. Neither available
    raise RuntimeError(
        "No supported presentation rendering engine available. "
        "PowerPoint-to-PDF conversion requires LibreOffice (headless) or Microsoft PowerPoint installed on the system."
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
        print("Usage: python ppt_to_pdf.py <input_ppt_or_pptx> <output_pdf>")
        sys.exit(1)

    ppt_in = sys.argv[1]
    pdf_out = sys.argv[2]

    try:
        convert_ppt_to_pdf(ppt_in, pdf_out)
        print("SUCCESS")
    except Exception as err:
        import traceback
        traceback.print_exc()
        print(f"ERROR: {err}", file=sys.stderr)
        sys.exit(1)

#!/usr/bin/env python3
"""
docx_to_pdf_win.py - High-fidelity DOCX → PDF via Microsoft Word COM automation.
Requires: Windows + Microsoft Word installed + pywin32

Usage: python docx_to_pdf_win.py <input.docx> <output.pdf>
Exits 0 on success (prints "OK:<bytes>"), exits 1 on error (prints to stderr).
"""
import sys
import os

def main():
    if len(sys.argv) != 3:
        print("Usage: docx_to_pdf_win.py <input.docx> <output.pdf>", file=sys.stderr)
        sys.exit(1)

    input_docx = sys.argv[1]
    output_pdf = sys.argv[2]

    if not os.path.exists(input_docx):
        print(f"Input file not found: {input_docx}", file=sys.stderr)
        sys.exit(1)

    # Use absolute paths — Word COM requires them
    input_docx = os.path.abspath(input_docx)
    output_pdf  = os.path.abspath(output_pdf)

    try:
        import win32com.client
        import pythoncom
    except ImportError:
        print("pywin32 not installed. Run: pip install pywin32", file=sys.stderr)
        sys.exit(1)

    word = None
    doc  = None
    try:
        # Initialize COM on this thread (needed when called from a subprocess)
        pythoncom.CoInitialize()

        word = win32com.client.DispatchEx("Word.Application")
        word.Visible = False
        word.DisplayAlerts = 0  # wdAlertsNone

        # Open document — ReadOnly to avoid lock files
        doc = word.Documents.Open(
            input_docx,
            ConfirmConversions=False,
            ReadOnly=True,
            AddToRecentFiles=False,
            Revert=False,
        )

        # wdFormatPDF = 17
        doc.SaveAs2(output_pdf, FileFormat=17)
        doc.Close(False)
        doc = None

        if not os.path.exists(output_pdf):
            print("Word produced no output file.", file=sys.stderr)
            sys.exit(1)

        size = os.path.getsize(output_pdf)
        print(f"OK:{size}", flush=True)
        sys.exit(0)

    except Exception as e:
        print(f"Word COM conversion failed: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        if doc is not None:
            try:
                doc.Close(False)
            except Exception:
                pass
        if word is not None:
            try:
                word.Quit()
            except Exception:
                pass
        try:
            pythoncom.CoUninitialize()
        except Exception:
            pass


if __name__ == "__main__":
    main()

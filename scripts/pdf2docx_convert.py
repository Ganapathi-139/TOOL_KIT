#!/usr/bin/env python3
"""
pdf2docx_convert.py - Called by the Next.js API route to convert PDF → DOCX.
Usage: python pdf2docx_convert.py <input.pdf> <output.docx>
Exits 0 on success, 1 on error. Writes ONLY errors to stderr.
"""
import sys
import os

def main():
    if len(sys.argv) != 3:
        print("Usage: pdf2docx_convert.py <input.pdf> <output.docx>", file=sys.stderr)
        sys.exit(1)

    input_pdf = sys.argv[1]
    output_docx = sys.argv[2]

    if not os.path.exists(input_pdf):
        print(f"Input file not found: {input_pdf}", file=sys.stderr)
        sys.exit(1)

    try:
        import warnings
        warnings.filterwarnings("ignore")

        # Suppress pdf2docx/pymupdf verbose logging
        import logging
        logging.disable(logging.CRITICAL)

        from pdf2docx import Converter
        cv = Converter(input_pdf)
        cv.convert(output_docx, start=0, end=None)
        cv.close()

        if not os.path.exists(output_docx):
            print("Conversion produced no output file.", file=sys.stderr)
            sys.exit(1)

        size = os.path.getsize(output_docx)
        print(f"OK:{size}", flush=True)  # Only this line goes to stdout
        sys.exit(0)

    except ImportError as e:
        print(f"Missing dependency: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Conversion failed: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()

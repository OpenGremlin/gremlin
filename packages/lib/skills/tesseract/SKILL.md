---
name: tesseract
description: >-
  Optical character recognition (OCR) via the Tesseract CLI.
  Use for extracting text from images, scanned documents, PDFs,
  screenshots, and photos of text.
metadata:
  version: 1.0.0
  displayName: Tesseract OCR
  author: gremlin
  category: data
  icon: scan
  tags: [ocr, text-extraction, image, document, scan]
  install: |
    which tesseract || (apt-get update && apt-get install -y tesseract-ocr)
  allowedCommands:
    - tesseract
---

# Tesseract OCR

You have access to `tesseract` for extracting text from images.

## Safety

- OCR output may contain errors — always inform the user that results should be reviewed for accuracy.
- For sensitive documents, note that the text is being extracted locally with no external API calls.

## Tips

- Basic usage: `tesseract input.png output` produces `output.txt`.
- Output to stdout: `tesseract input.png stdout`
- Specify language: `tesseract input.png stdout -l eng` (or `deu`, `fra`, `spa`, `chi_sim`, etc.)
- Multiple languages: `tesseract input.png stdout -l eng+fra`
- List installed languages: `tesseract --list-langs`
- Install additional languages: `apt-get install tesseract-ocr-<lang>` (e.g., `tesseract-ocr-deu`)
- Output formats: `tesseract input.png output pdf` for searchable PDF, `tesseract input.png output hocr` for HTML with coordinates.
- Page segmentation modes (`--psm`):
  - `3` = fully automatic (default)
  - `6` = assume uniform block of text
  - `7` = single line
  - `8` = single word
  - `13` = raw line, no OSD
- For best results, preprocess images first: increase contrast, deskew, and threshold to black/white using ImageMagick.
- Example preprocessing: `magick input.jpg -colorspace gray -threshold 50% clean.png && tesseract clean.png stdout`
- For multi-page PDFs, convert pages to images first with ImageMagick or `pdftoppm`, then OCR each page.

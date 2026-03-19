---
name: imagemagick
description: >-
  Image processing via the ImageMagick CLI. Use for resizing,
  cropping, converting formats, compositing, adding text/watermarks,
  adjusting colors, generating thumbnails, and batch image operations.
metadata:
  version: 1.0.0
  displayName: ImageMagick
  author: gremlin
  category: data
  icon: image
  tags: [image, photo, conversion, resize, graphics]
  install: |
    which magick || which convert || (apt-get update && apt-get install -y imagemagick)
---

# ImageMagick

You have access to ImageMagick for image processing. Use `magick` (v7) or `convert`/`identify` (v6) commands.

## Safety

- Always confirm before overwriting existing files.
- For batch operations, preview on a single file first before processing all.
- Be mindful of memory usage with very large images — use `-limit memory 512MiB` if needed.
- Check ImageMagick's policy.xml if operations on PDFs or large images are blocked.

## Tips

- Use `magick identify <file>` (or `identify <file>`) to inspect image properties before processing.
- Use `magick identify -verbose <file>` for detailed metadata (EXIF, color profile, etc.).
- Prefer `magick` over `convert` — v7 unified CLI avoids PATH conflicts with Windows `convert`.
- For batch processing, use `mogrify` (in-place) or loop with `magick convert` (new files).
- Use `-quality 85` for JPEG to balance size and quality.
- Use `-strip` to remove EXIF/metadata for smaller file sizes.
- Use `-resize 800x600>` (note the `>`) to only shrink, never enlarge.
- Use `-gravity center -extent WxH` for padding/canvas extension.
- Composite images: `magick base.png overlay.png -composite output.png`
- Add text: `magick input.png -gravity south -annotate +0+10 "Caption" output.png`

---
name: ffmpeg
description: >-
  Audio and video processing via the ffmpeg CLI. Use for
  transcoding, trimming, merging, extracting audio, generating
  thumbnails, converting formats, adjusting resolution/bitrate,
  and any media manipulation task.
metadata:
  version: 1.0.0
  displayName: FFmpeg
  author: gremlin
  category: data
  icon: video
  tags: [video, audio, media, transcoding, conversion]
  install: |
    which ffmpeg || (apt-get update && apt-get install -y ffmpeg)
  allowedCommands:
    - ffmpeg
    - ffprobe
---

# FFmpeg

You have access to `ffmpeg` and `ffprobe` for audio/video processing.

## Safety

- Always confirm destructive operations (overwriting existing files) with the user.
- Use `-n` to prevent accidental overwrites, or ask before using `-y`.
- For large files, estimate output size and warn the user if disk space may be an issue.
- Prefer `-c copy` (stream copy) when no re-encoding is needed — it's instant and lossless.

## Tips

- Use `ffprobe -v quiet -print_format json -show_format -show_streams <file>` to inspect media files before processing.
- When trimming, use `-ss` before `-i` for fast seeking, after `-i` for frame-accurate seeking.
- For batch operations, loop over files rather than running a single complex command.
- Use `-map` to select specific streams when the input has multiple audio/video/subtitle tracks.
- Use `-preset` to control encoding speed vs quality tradeoff (ultrafast to veryslow).
- Use `-crf` for quality-based encoding (lower = better quality, 18-23 is typical for H.264).

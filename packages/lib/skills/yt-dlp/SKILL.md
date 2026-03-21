---
name: yt-dlp
description: >-
  Download video and audio from YouTube, Twitter/X, TikTok,
  Instagram, and 1000+ other sites. Use for downloading
  videos, extracting audio, fetching subtitles/metadata,
  or archiving media content.
metadata:
  version: 1.0.0
  displayName: yt-dlp
  author: gremlin
  category: data
  icon: video
  tags: [video, audio, download, youtube, media]
  install: |
    which yt-dlp || pip install yt-dlp
  allowedCommands:
    - yt-dlp
---

# yt-dlp

You have access to `yt-dlp` for downloading video and audio from the web.

## Safety

- Always confirm downloads with the user before starting, especially for large files or playlists.
- Respect copyright — only download content the user has rights to access.
- Use `--simulate` or `-s` to preview what would be downloaded without actually downloading.
- Use `--restrict-filenames` to avoid problematic characters in output filenames.

## Tips

- Use `yt-dlp --list-formats <url>` to see available quality options before downloading.
- Extract audio only: `yt-dlp -x --audio-format mp3 <url>`
- Best quality video+audio: `yt-dlp -f "bestvideo+bestaudio" --merge-output-format mp4 <url>`
- Download subtitles: `yt-dlp --write-subs --sub-langs en <url>`
- Get metadata as JSON: `yt-dlp --dump-json <url>`
- Limit download speed: `--rate-limit 5M`
- Download specific playlist items: `--playlist-items 1-5`
- Use `-o "%(title)s.%(ext)s"` to control output filename template.
- For age-restricted or geo-blocked content, `--cookies-from-browser chrome` can help.

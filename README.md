# Verse & Frame — Song Studio

A local-first music creation web app by Lyudmil Hristov. Three different AI services, one guided creative workspace:

1. **Gemini**: prepare a lyric prompt, open the service, paste and edit the result, then approve it.
2. **Suno**: prepare music direction and approved lyrics; upload your lawfully downloaded audio or your own recording.
3. **Leonardo.Ai**: prepare an artwork prompt and upload the resulting background image.
4. Preview your audio with a static image; export original media, lyrics, and a JSON brief.

## Important: manual handoff MVP

This version is a working workflow app, **not automatic AI generation or API orchestration**. It has no API keys, API integrations, embedded provider logins, or billing. External services require their own accounts and may limit free access. Free access does not guarantee downloads or commercial rights. Use provider-supported downloads only. No music-video rendering is included.

## Run locally

Requires Python 3; no npm packages or build step required:

```sh
cd song-studio
python3 -m http.server 4210 --bind 127.0.0.1
```

Open http://127.0.0.1:4210. Keep the server running. The files can also be deployed to any static HTTPS host.

## Storage and privacy

Project text and uploaded files are saved in IndexedDB in your browser, scoped to this site's address. Nothing is uploaded by this app. External links open only when you click them. Changing browser/address, private browsing, clearing site data or storage eviction may lose the saved project. Export important work. The brief export contains text only; save audio/art separately. One current project is supported; starting a new project requires confirmation.

Audio: up to 40 MB, in a format your browser can decode (MP3/WAV recommended). Images: PNG/JPEG/WebP, up to 10 MB. Files are validated before replacing saved media. No generated examples are misrepresented as real service output.

## Tests

Install Playwright in a separate development environment, then run:

```sh
PLAYWRIGHT_PATH=/absolute/path/to/playwright node tests/browser.cjs
```

The local server must be running on port 4210. Tests use a separate temporary browser profile and synthetic media, never your saved project.

## Future integration

Automatic generation requires supported provider APIs, secured server-side credentials, a job queue and explicit cost/licensing choices. Do not put API keys in this static frontend or automate consumer websites to evade limits.

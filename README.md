# Telegram Web — assets and extension workspace

This repository bundles **static JavaScript artifacts** from **Telegram Web (version A)** together with a **Manifest V3 Chrome extension** intended for experimentation on `web.telegram.org/a`.

Telegram and related marks are trademarks of their respective owners. This project is **not** affiliated with or endorsed by Telegram.

## Contents

| Path | Description |
|------|-------------|
| `telegram.html` | HTML shell for the Telegram Web A client (entry document). |
| `telegram-main.js`, `chunk-*.js` | Webpack-produced application bundles; matching `*.map` files are included for debugging. |
| `bundle-main.js` | Placeholder / failed fetch artifact (not a functional bundle). Safe to replace or remove if you supply a real asset. |
| `AI Stealth: Take Home Challenge 2025/AIStealthTakeHomeChallenge/` | Chrome extension: content scripts and injection helpers scoped to `web.telegram.org/a`. |

## Chrome extension

The extension targets **Telegram Web A only** (`*://web.telegram.org/a*`), per the original challenge constraints.

**Load unpacked (Chromium / Chrome):**

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the folder   `AI Stealth: Take Home Challenge 2025/AIStealthTakeHomeChallenge/`.

Review `manifest.json` for permissions and injected resources before installation.

## Local static hosting (optional)

To serve the root of this repository over HTTP (many SPAs expect HTTP, not `file://`):

```bash
python3 -m http.server 8080 --directory .
```

Then open `http://localhost:8080/telegram.html`.

**Note:** The HTML shell may reference hashed filenames (for example `main.*.js` / `main.*.css`) that are not present in this tree, while the repo includes differently named bundles (`telegram-main.js`, `chunk-*.js`). Align script and stylesheet references—or supply the matching build output—if you need a fully self-contained local run.

## Development notes

- Source maps are large; clone with adequate disk space if you need the full history.
- Treat bundled client code as **read-only vendor output** unless you explicitly rebuild from upstream sources.

## License

See [LICENSE](LICENSE).

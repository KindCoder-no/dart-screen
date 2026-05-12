# dart-screen

This project now includes a Node.js Express backend for system actions.

## Run

Install dependencies:

```bash
npm install
```

Start frontend + backend together:

```bash
npm run dev:full
```

Frontend runs on port `5173` and proxies `/api/*` to backend on port `3001`.

## Production

Build frontend assets:

```bash
npm run build
```

Start Express in production mode:

```bash
npm run start
```

In production, Express serves the built frontend from `dist/` and also serves all `/api/*` routes from the same server.

## Backend API

- `GET /api/health`
- `GET /api/apps` — Returns list of configured applications
- `GET /api/system/stats` — Returns system info (hostname, CPU, memory, network)
- `POST /api/system/reboot`
- `POST /api/system/shutdown`

## Configuration

### Applications

Edit [backend/apps-config.json](backend/apps-config.json) to add, remove, or modify applications displayed on the dashboard. Each app supports:

- `name` — Display name
- `url` — Application URL
- `icon` — Icon name (target, barchart, monitor, etc.)
- `description` — Short description
- `color` — Tailwind gradient color class
- `openMode` — How to open: `iframe` (embedded) or `new-tab` (default)

## Ubuntu setup for reboot/shutdown

The backend calls:

- `sudo -n /usr/bin/systemctl reboot`
- `sudo -n /usr/bin/systemctl poweroff`

`-n` means non-interactive mode: no password prompt is allowed. If sudoers is not configured, the API returns an error immediately.

Allow passwordless execution for only these commands:

```bash
sudo visudo
```

Add a line (replace `<username>`):

```text
<username> ALL=(root) NOPASSWD: /usr/bin/systemctl reboot, /usr/bin/systemctl poweroff
```

Then verify:

```bash
sudo -n /usr/bin/systemctl reboot --help
sudo -n /usr/bin/systemctl poweroff --help
```

If these commands still ask for password, sudoers is not configured correctly.

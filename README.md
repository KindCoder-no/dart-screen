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
- `POST /api/system/reboot`
- `POST /api/system/shutdown`

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

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

## Docker

### Docker Compose (Recommended)

Using docker-compose is the easiest way to run with config management:

```bash
docker-compose up -d
```

This will:
- Pull the image from Docker Hub (`emresanden/dart-screen`)
- Start the container on port 3001
- Mount `./config` folder for configuration

Edit [config/config.json](config/config.json) to customize applications. Changes will be reflected after restarting the container.

### Manual Docker

Pull the image:

```bash
docker pull emresanden/dart-screen:latest
```

Run the container:

```bash
docker run -d \
  --name dart-screen \
  -p 3001:3001 \
  --restart unless-stopped \
  emresanden/dart-screen:latest
```

### Build locally

If you want to build from source:

```bash
docker build -t dart-screen:latest .
docker run -d \
  --name dart-screen \
  -p 3001:3001 \
  --restart unless-stopped \
  dart-screen:latest
```

For system commands (reboot/shutdown) to work inside containers, run with:

```bash
docker run -d \
  --name dart-screen \
  -p 3001:3001 \
  --privileged \
  --restart unless-stopped \
  emresanden/dart-screen:latest
```

The `--privileged` flag allows the container to execute systemctl commands on the host. Without it, reboot/shutdown will fail.

## Backend API

- `GET /api/health`
- `GET /api/apps` — Returns list of configured applications
- `GET /api/system/stats` — Returns system info (hostname, CPU, memory, network)
- `POST /api/system/reboot`
- `POST /api/system/shutdown`

## Configuration

### Applications

All deployments use [config/config.json](config/config.json) for application configuration. Edit this file to add, remove, or modify applications displayed on the dashboard.

For local development (`npm run dev:full`), `npm start`, or Docker Compose, changes will be reflected after restarting the service.

Each app supports:

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

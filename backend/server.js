import 'dotenv/config';
import express from 'express';
import { execFile } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import os from 'node:os';

const execFileAsync = promisify(execFile);

const app = express();
const port = Number(process.env.PORT || 3001);
const isProduction = process.env.NODE_ENV === 'production';
const distPath = path.resolve(process.cwd(), 'dist');
const distIndexPath = path.join(distPath, 'index.html');

app.use(express.json());

async function runSystemctlCommand(action) {
  // Use non-interactive sudo and fixed args to avoid password prompts and injection.
  return execFileAsync('sudo', ['-n', '/usr/bin/systemctl', action]);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'system-control-backend' });
});

app.get('/api/version', (_req, res) => {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageData = JSON.parse(readFileSync(packagePath, 'utf-8'));
    res.json({ version: packageData.version });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ ok: false, error: message });
  }
});

app.get('/api/apps', (_req, res) => {
  try {
    // Use config/config.json (works for both docker-compose and local)
    const configPath = path.join(process.cwd(), 'config', 'config.json');
    const configData = JSON.parse(readFileSync(configPath, 'utf-8'));
    const apps = configData.apps || configData;
    res.json(apps);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ ok: false, error: message });
  }
});

app.get('/api/system/stats', (_req, res) => {
  try {
    const hostname = os.hostname();
    const platform = os.platform();
    const release = os.release();
    const arch = os.arch();
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const totalmem = os.totalmem();
    const freemem = os.freemem();
    const usedmem = totalmem - freemem;
    const uptime = os.uptime();
    const interfaces = os.networkInterfaces();

    // Extract primary IP addresses
    const ips = [];
    for (const [name, addrs] of Object.entries(interfaces)) {
      if (name.startsWith('lo')) continue; // Skip localhost

      for (const addr of addrs) {
        if (addr.family === 'IPv4') {
          ips.push({ interface: name, ip: addr.address });
        }
      }
    }

    const stats = {
      ok: true,
      hostname,
      platform,
      release,
      arch,
      cpuModel: cpus.length > 0 ? cpus[0].model : 'Unknown',
      cpuCount: cpus.length,
      loadAverage: {
        one: loadAvg[0].toFixed(2),
        five: loadAvg[1].toFixed(2),
        fifteen: loadAvg[2].toFixed(2),
      },
      memory: {
        total: totalmem,
        used: usedmem,
        free: freemem,
        usedPercent: ((usedmem / totalmem) * 100).toFixed(1),
      },
      uptime,
      upTimeString: formatUptime(uptime),
      networkInterfaces: ips,
      timestamp: new Date().toISOString(),
    };

    res.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ ok: false, error: message });
  }
});

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

app.post('/api/system/reboot', async (_req, res) => {
  try {
    await runSystemctlCommand('reboot');
    res.status(202).json({ ok: true, action: 'reboot', accepted: true });
  } catch (error) {
    if (error && typeof error === 'object' && 'stderr' in error) {
      const stderr = String(error.stderr || '');
      if (stderr.includes('sudo:') && stderr.includes('password is required')) {
        return res.status(503).json({
          ok: false,
          action: 'reboot',
          error: 'Passwordless sudo is not configured for reboot. Configure sudoers NOPASSWD for /usr/bin/systemctl reboot.',
        });
      }
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ ok: false, action: 'reboot', error: message });
  }
});

app.post('/api/system/shutdown', async (_req, res) => {
  try {
    await runSystemctlCommand('poweroff');
    res.status(202).json({ ok: true, action: 'shutdown', accepted: true });
  } catch (error) {
    if (error && typeof error === 'object' && 'stderr' in error) {
      const stderr = String(error.stderr || '');
      if (stderr.includes('sudo:') && stderr.includes('password is required')) {
        return res.status(503).json({
          ok: false,
          action: 'shutdown',
          error: 'Passwordless sudo is not configured for shutdown. Configure sudoers NOPASSWD for /usr/bin/systemctl poweroff.',
        });
      }
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ ok: false, action: 'shutdown', error: message });
  }
});

if (isProduction && existsSync(distIndexPath)) {
  app.use(express.static(distPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }

    return res.sendFile(distIndexPath);
  });
}

app.listen(port, '0.0.0.0', () => {
  const modeLabel = isProduction ? 'production' : 'development';
  console.log(`System control backend listening on port ${port} (${modeLabel})`);

  if (isProduction && !existsSync(distIndexPath)) {
    console.warn('Production mode is enabled but dist/index.html was not found. Run "npm run build" before starting.');
  }
});

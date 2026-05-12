import 'dotenv/config';
import express from 'express';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(express.json());

function requireApiToken(req, res, next) {
  const configuredToken = process.env.SYSTEM_API_TOKEN;

  if (!configuredToken) {
    return res.status(500).json({
      ok: false,
      error: 'SYSTEM_API_TOKEN is not configured on the server.',
    });
  }

  const headerToken = req.header('x-api-key');
  const authHeader = req.header('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : undefined;

  const incomingToken = headerToken || bearerToken;

  if (!incomingToken || incomingToken !== configuredToken) {
    return res.status(401).json({ ok: false, error: 'Unauthorized.' });
  }

  next();
}

async function runSystemctlCommand(action) {
  // Use non-interactive sudo and fixed args to avoid password prompts and injection.
  return execFileAsync('sudo', ['-n', '/usr/bin/systemctl', action]);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'system-control-backend' });
});

app.post('/api/system/reboot', requireApiToken, async (_req, res) => {
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

app.post('/api/system/shutdown', requireApiToken, async (_req, res) => {
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

app.listen(port, '0.0.0.0', () => {
  console.log(`System control backend listening on port ${port}`);
});

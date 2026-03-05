/**
 * Aguarda o servidor Vite estar pronto em localhost:5173
 * e então inicia o Electron em modo desenvolvimento.
 * Usa apenas módulos nativos do Node.js.
 */

import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import electron from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VITE_URL = 'http://localhost:5173';
const MAX_ATTEMPTS = 60;
const RETRY_DELAY_MS = 1000;

let attempts = 0;

function startElectron() {
  console.log('[dev-electron] Vite está pronto. Iniciando Electron...');

  // O pacote electron exporta o path do executável como default export
  const electronExe = electron; // retorna string com o path do exe

  const proc = spawn(electronExe, ['.'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' },
    cwd: path.resolve(__dirname, '..'),
  });

  proc.on('close', (code) => {
    process.exit(code ?? 0);
  });

  proc.on('error', (err) => {
    console.error('[dev-electron] Erro ao iniciar Electron:', err.message);
    process.exit(1);
  });
}

function tryConnect() {
  attempts++;

  const req = http.get(VITE_URL, () => {
    req.destroy();
    startElectron();
  });

  req.on('error', () => {
    req.destroy();
    if (attempts >= MAX_ATTEMPTS) {
      console.error(`\n[dev-electron] Timeout: Vite não ficou pronto após ${MAX_ATTEMPTS}s.`);
      process.exit(1);
    }
    process.stdout.write(`\r[dev-electron] Aguardando Vite... ${attempts}s`);
    setTimeout(tryConnect, RETRY_DELAY_MS);
  });
}

console.log(`[dev-electron] Aguardando ${VITE_URL} ficar disponível...`);
tryConnect();

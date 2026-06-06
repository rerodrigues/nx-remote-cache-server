import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Store, Describable } from '@renatorodrigues/cacheiro-types';
import { cfg } from './config.js';

const isProd = process.env.NODE_ENV === 'production';

const CYAN = isProd ? '' : '\x1b[36m';
const BOLD = isProd ? '' : '\x1b[1m';
const DIM = isProd ? '' : '\x1b[2m';
const RESET = isProd ? '' : '\x1b[0m';

const TAGLINE = 'NX remote cache';

const LOGO = [
  '  ██████╗ █████╗  ██████╗██╗  ██╗███████╗██╗██████╗   ██████╗ ',
  ' ██╔════╝██╔══██╗██╔════╝██║  ██║██╔════╝██║██╔══██╗ ██╔═══██╗',
  ' ██║     ███████║██║     ███████║█████╗  ██║██████╔╝ ██║   ██║',
  ' ██║     ██╔══██║██║     ██╔══██║██╔══╝  ██║██╔══██╗ ██║   ██║',
  ' ╚██████╗██║  ██║╚██████╗██║  ██║███████╗██║██║  ██║ ╚██████╔╝',
  '  ╚═════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝╚═╝  ╚═╝ ╚═════╝ ',
];

const LOGO_WIDTH = Math.max(...LOGO.map((l) => l.length));

function readPkg(): { name: string; version: string } {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  try {
    return JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
  } catch {
    return { name: 'cacheiro', version: '?' };
  }
}

const pkg = readPkg();

function buildBox(rows: [string, string][], minOuterWidth = 0): string {
  const labelWidth = Math.max(...rows.map(([k]) => k.length));
  const lines = rows.map(([k, v]) => `${k.padEnd(labelWidth)}  ${v}`);
  const width = Math.max(...lines.map((l) => l.length), Math.max(0, minOuterWidth - 6));
  const hr = '─'.repeat(width + 4);
  return [
    `${DIM}┌${hr}┐`,
    ...lines.map((line) => `│  ${line.padEnd(width)}  │`),
    `└${hr}┘${RESET}`,
  ].join('\n');
}

function renderTagline(version?: string): string {
  const label = ` ${TAGLINE} `;
  const padLen = Math.max(0, Math.floor((LOGO_WIDTH - label.length) / 2));
  const pad = '─'.repeat(padLen);
  const base = `${pad}${label}${pad}`.padEnd(LOGO_WIDTH);
  if (version) {
    const v = `v${version}`;
    return `${DIM}${base.slice(0, LOGO_WIDTH - v.length - 1)} ${v}${RESET}`;
  }
  return `${DIM}${base}${RESET}`;
}

function renderSimplified(version?: string): string {
  const name = pkg.name
    .split('/')
    .pop()!
    .replace(/^(.)/, (c) => c.toUpperCase());
  const v = version ? `  v${version}` : '';
  return `${BOLD}${name}${RESET}  ${DIM}${TAGLINE}${v}${RESET}`;
}

export function printBanner(port: number, store: Store): void {
  const { server } = cfg;
  const parts: string[] = [];

  if (server.banner) {
    parts.push(`${CYAN}${LOGO.join('\n')}${RESET}`);
    parts.push(renderTagline(server.infobox ? undefined : pkg.version));
  } else {
    parts.push(renderSimplified(server.infobox ? undefined : pkg.version));
  }

  if (server.infobox) {
    const storeRows: [string, string][] =
      'describe' in store ? (store as unknown as Describable).describe() : [];
    const rows: [string, string][] = [
      ['version', pkg.version],
      ['url', `http://${server.host}:${port}`],
      ['store', cfg.store.type],
      ...storeRows,
    ];
    parts.push(buildBox(rows, server.banner ? LOGO_WIDTH : 0));
  }

  console.log('\n' + parts.join('\n\n') + '\n');
}

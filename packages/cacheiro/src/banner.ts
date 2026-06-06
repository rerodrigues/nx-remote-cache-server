import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Store, Describable } from '@renatorodrigues/cacheiro-types';
import { cfg } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

function readVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
    return pkg.version as string;
  } catch {
    return '?';
  }
}

export function printBanner(port: number, store: Store): void {
  const { server } = cfg;
  const version = readVersion();
  const storeRows: [string, string][] =
    'describe' in store ? (store as unknown as Describable).describe() : [];

  const rows: [string, string][] = [
    ['version', version],
    ['url', `http://${server.host}:${port}`],
    ['store', cfg.store.type],
    ...storeRows,
  ];

  const labelWidth = Math.max(...rows.map(([k]) => k.length));
  const lines = rows.map(([k, v]) => `  ${k.padEnd(labelWidth)}  ${v}`);
  const minWidth = server.banner ? Math.max(...LOGO.map((l) => l.length)) : 0;
  const width = Math.max(...lines.map((l) => l.length), minWidth);
  const hr = '─'.repeat(width + 2);

  const box = [
    `${DIM}┌${hr}┐`,
    ...lines.map((line) => `│ ${line.padEnd(width)} │`),
    `└${hr}┘${RESET}`,
  ].join('\n');

  if (server.banner) {
    const logoWidth = Math.max(...LOGO.map((l) => l.length));
    const label = ` ${TAGLINE} `;
    const padLen = Math.max(0, Math.floor((logoWidth - label.length) / 2));
    const pad = '─'.repeat(padLen);
    const subtitle = `${pad}${label}${pad}`.padEnd(logoWidth);
    console.log(`\n${CYAN}${LOGO.join('\n')}${RESET}\n\n${DIM}${subtitle}${RESET}\n\n${box}\n`);
  } else {
    console.log(`\n${BOLD}Cacheiro${RESET}  ${DIM}${TAGLINE}${RESET}\n\n${box}\n`);
  }
}

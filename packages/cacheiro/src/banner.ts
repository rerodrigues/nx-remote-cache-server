import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import figlet from 'figlet';
import type { Store, Describable } from '@renatorodrigues/cacheiro-types';
import type { CacheiroConfig } from './config.js';

const isProd = process.env.NODE_ENV === 'production';

const CYAN = isProd ? '' : '\x1b[36m';
const BOLD = isProd ? '' : '\x1b[1m';
const DIM = isProd ? '' : '\x1b[2m';
const RESET = isProd ? '' : '\x1b[0m';

const TAGLINE = 'NX remote cache';

function init(): { pkgName: string; pkgVersion: string; LOGO: string[]; LOGO_WIDTH: number } {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  let pkgName = 'cacheiro';
  let pkgVersion = '?';
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
    pkgName = pkg.name;
    pkgVersion = pkg.version;
  } catch {}
  const name = pkgName
    .split('/')
    .pop()!
    .replace(/^(.)/, (c) => c.toUpperCase());
  const LOGO = figlet.textSync(name, { font: 'ANSI Shadow' }).trimEnd().split('\n');
  return { pkgName: name, pkgVersion, LOGO, LOGO_WIDTH: Math.max(...LOGO.map((l) => l.length)) };
}

const { pkgName, pkgVersion, LOGO, LOGO_WIDTH } = init();

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
  const v = version ? `  v${version}` : '';
  return `${BOLD}${pkgName}${RESET}  ${DIM}${TAGLINE}${v}${RESET}`;
}

export function printBanner(store: Store, config: CacheiroConfig): void {
  const { server } = config;
  const parts: string[] = [];

  if (server.banner) {
    parts.push(`${CYAN}${LOGO.join('\n')}${RESET}`);
    parts.push(renderTagline(server.infobox ? undefined : pkgVersion));
  } else {
    parts.push(renderSimplified(server.infobox ? undefined : pkgVersion));
  }

  if (server.infobox) {
    const storeRows: [string, string][] =
      'describe' in store ? (store as unknown as Describable).describe() : [];
    const rows: [string, string][] = [
      ['version', pkgVersion],
      ['url', `http://${server.host}:${server.port}`],
      ['store', config.store.type],
      ...storeRows,
    ];
    parts.push(buildBox(rows, server.banner ? LOGO_WIDTH : 0));
  }

  console.log('\n' + parts.join('\n\n') + '\n');
}

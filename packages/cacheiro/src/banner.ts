import figlet from 'figlet';
import type { CacheiroStore, Describable } from '@renatorodrigues/cacheiro-types';
import type { CacheiroConfig } from './config.js';
import { createRequire } from 'node:module';

const isProd = process.env.NODE_ENV === 'production';

const CYAN = isProd ? '' : '\x1b[36m';
const BOLD = isProd ? '' : '\x1b[1m';
const DIM = isProd ? '' : '\x1b[2m';
const RESET = isProd ? '' : '\x1b[0m';

const PKG_NAME = 'Cacheiro';
const TAGLINE = 'NX remote cache';
const PKG_VERSION: string = createRequire(import.meta.url)('../package.json').version;

const LOGO = figlet.textSync(PKG_NAME, { font: 'ANSI Shadow' }).trimEnd().split('\n');
const LOGO_WIDTH = Math.max(...LOGO.map((l) => l.length));

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
  return `${BOLD}${PKG_NAME}${RESET}  ${DIM}${TAGLINE}${v}${RESET}`;
}

export function printBanner(store: CacheiroStore, config: CacheiroConfig): void {
  const { server } = config;
  const parts: string[] = [];

  if (server.banner) {
    parts.push(`${CYAN}${LOGO.join('\n')}${RESET}`);
    parts.push(renderTagline(server.infobox ? undefined : PKG_VERSION));
  } else {
    parts.push(renderSimplified(server.infobox ? undefined : PKG_VERSION));
  }

  if (server.infobox) {
    const storeRows: [string, string][] =
      'describe' in store ? (store as unknown as Describable).describe() : [];
    const rows: [string, string][] = [
      ['version', PKG_VERSION],
      ['url', `http://${server.host}:${server.port}`],
      ['store', store.constructor.name],
      ...storeRows,
      ...(config.auth.token ? [['auth', 'enabled'] as [string, string]] : []),
    ];
    parts.push(buildBox(rows, server.banner ? LOGO_WIDTH : 0));
  }

  console.log('\n\n' + parts.join('\n\n') + '\n');
}

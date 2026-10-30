import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CacheiroStore } from '@renatorodrigues/cacheiro-types';
import { printBanner } from '../src/banner.js';
import type { CacheiroConfig } from '../src/config.js';

class StubStore implements CacheiroStore {
  async mount(): Promise<void> {}
  async exists(): Promise<boolean> {
    return false;
  }
  async write(): Promise<void> {}
  read(): never {
    throw new Error('not used');
  }
}

const baseServer = { port: 3000, host: 'localhost', bodyLimitMb: 10, banner: false };

function printed(config: CacheiroConfig): string {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  printBanner(new StubStore(), config);
  return log.mock.calls.map((args) => args.join(' ')).join('\n');
}

describe('printBanner auth row', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows auth enabled when a token is set', () => {
    const output = printed({ server: baseServer, auth: { token: 'secret' } });
    expect(output).toMatch(/auth\s+enabled/);
    expect(output).not.toContain('DISABLED');
  });

  it('warns that auth is disabled when no auth is configured', () => {
    const output = printed({ server: baseServer });
    expect(output).toContain('auth DISABLED');
  });

  it('shows the warning below the info box', () => {
    const output = printed({ server: { ...baseServer, infobox: true } });
    expect(output.indexOf('└')).toBeGreaterThan(-1);
    expect(output.indexOf('auth DISABLED')).toBeGreaterThan(output.indexOf('└'));
  });

  it('warns that auth is disabled when auth.token is empty', () => {
    const output = printed({ server: baseServer, auth: { token: '' } });
    expect(output).toContain('auth DISABLED');
  });

  it('warns without the info box when infobox is hidden and no auth is configured', () => {
    const output = printed({ server: { ...baseServer, infobox: false } });
    expect(output).toContain('auth DISABLED');
    expect(output).not.toContain('┌');
  });

  it('prints no auth warning when infobox is hidden and a token is set', () => {
    const output = printed({
      server: { ...baseServer, infobox: false },
      auth: { token: 'secret' },
    });
    expect(output).not.toContain('DISABLED');
  });
});

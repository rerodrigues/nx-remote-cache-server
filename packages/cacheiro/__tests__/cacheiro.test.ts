import { describe, it, expect } from 'vitest';
import cacheiro from '../src/cacheiro';

describe('cacheiro', () => {
  it('returns expected string', () => {
    expect(cacheiro()).toBe('Hello from cacheiro');
  });
});

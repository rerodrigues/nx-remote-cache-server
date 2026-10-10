const dateFormats = {
  long: new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
  short: new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }),
};

export function formatPostDate(time: number, style: 'long' | 'short' = 'long'): string {
  return dateFormats[style].format(time);
}

export function isPostPath(relativePath: string): boolean {
  return /^blog\/[^/]+\.md$/.test(relativePath) && relativePath !== 'blog/index.md';
}

export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function tagUrl(tag: string): string {
  return `/blog/tags/${tagSlug(tag)}`;
}

export function fullTitle(title: string, subtitle?: string): string {
  return subtitle ? `${title}: ${subtitle}` : title;
}

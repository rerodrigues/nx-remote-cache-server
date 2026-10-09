import { defineConfig } from 'vitepress';

const repo = 'https://github.com/rerodrigues/nx-remote-cache-server';
const base = '/nx-remote-cache-server/';
const siteUrl = `https://rerodrigues.github.io${base}`;
const siteTitle = 'Cacheiro - Self-hosted Nx remote cache server';
const siteDescription =
  'Self-hosted Nx and Lerna remote cache server. Open source, pluggable stores, no vendor lock-in.';

// Package READMEs are included verbatim into the docs pages, so their links
// (relative paths and GitHub tree URLs) must be mapped onto site pages.
const packageLink = new RegExp(
  `^(?:\\.\\./|${repo.replace(/[.]/g, '\\.')}/tree/main/packages/)(cacheiro(?:-[a-z0-9-]+)?)/?(#.*)?$`,
);

function toSitePath(href: string): string | undefined {
  const match = packageLink.exec(href);
  if (!match) return undefined;
  const [, name, hash = ''] = match;
  const page = name === 'cacheiro' ? 'core' : name.slice('cacheiro-'.length);
  return `/packages/${page}${hash}`;
}

export default defineConfig({
  title: siteTitle,
  description: siteDescription,
  base,
  cleanUrls: true,
  sitemap: { hostname: siteUrl },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
    ['link', { rel: 'icon', href: `${base}favicon.ico`, sizes: '48x48' }],
    ['link', { rel: 'apple-touch-icon', href: `${base}apple-touch-icon.png` }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: siteTitle }],
    ['meta', { property: 'og:locale', content: 'en_US' }],
    ['meta', { property: 'og:image', content: `${siteUrl}og-image.png` }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: `${siteUrl}og-image.png` }],
  ],

  transformPageData(pageData) {
    const path = pageData.relativePath
      .replace(/(^|\/)index\.md$/, '$1')
      .replace(/\.md$/, '');
    const url = `${siteUrl}${path}`;
    const title = pageData.frontmatter.title ?? pageData.title ?? siteTitle;
    const description = pageData.frontmatter.description ?? siteDescription;
    const ogTitle = pageData.relativePath === 'index.md' ? siteTitle : title;

    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push(
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:title', content: ogTitle }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { name: 'twitter:title', content: ogTitle }],
      ['meta', { name: 'twitter:description', content: description }],
    );
  },

  markdown: {
    theme: { light: 'catppuccin-latte', dark: 'catppuccin-macchiato' },
    config(md) {
      // The sign-off is rendered once by the theme layout, so drop the copy that
      // the README carries at the end of the included content.
      md.core.ruler.push('cacheiro-strip-readme-signoff', (state) => {
        if (!state.env.relativePath?.startsWith('packages/')) return;
        const rule = state.tokens.findLastIndex((t) => t.type === 'hr');
        if (rule === -1) return;
        const tail = state.tokens.slice(rule + 1);
        const isSignoff =
          tail.length > 0 &&
          tail.every((t) => t.type === 'html_block') &&
          tail.some((t) => t.content.includes('Crafted with'));
        if (isSignoff) state.tokens.splice(rule);
      });

      md.core.ruler.push('cacheiro-package-links', (state) => {
        for (const block of state.tokens) {
          for (const token of block.children ?? []) {
            if (token.type !== 'link_open') continue;
            const href = token.attrGet('href');
            const rewritten = href && toSitePath(href);
            if (rewritten) token.attrSet('href', rewritten);
          }
        }
      });
    },
  },

  themeConfig: {
    siteTitle: 'Cacheiro',
    logo: { light: '/logo-light.svg', dark: '/logo-dark.svg' },

    nav: [
      { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: 'Packages', link: '/packages/core', activeMatch: '/packages/' },
      {
        text: 'Article',
        link: 'https://dev.to/rerodrigues/creating-your-own-remote-cache-server-for-nx-and-lerna-with-cacheiro-2dcg',
      },
      { text: 'GitHub', link: repo },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting started', link: '/guide/getting-started' },
          { text: 'Architecture', link: '/guide/architecture' },
          { text: 'Security', link: '/guide/security' },
        ],
      },
      {
        text: 'Run it',
        items: [
          { text: 'Instants (Docker images)', link: '/packages/instants' },
          { text: 'Runner', link: '/packages/runner' },
        ],
      },
      {
        text: 'Build on it',
        items: [
          { text: 'Core', link: '/packages/core' },
          { text: 'Types and custom stores', link: '/packages/types' },
        ],
      },
      {
        text: 'Stores',
        items: [
          { text: 'Filesystem', link: '/packages/store-fs' },
          { text: 'S3', link: '/packages/store-s3' },
          { text: 'GCS', link: '/packages/store-gcs' },
          { text: 'Azure Blob', link: '/packages/store-azure' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: repo },
      {
        icon: {
          svg: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><ellipse cx="12" cy="12" rx="4" ry="9.5"/><path d="M2.5 12h19"/></g></svg>',
        },
        link: 'https://linktr.ee/renato.rodrigues',
        ariaLabel: 'Linktree (Renato Rodrigues)',
      },
    ],

    search: { provider: 'local' },

    footer: {
      message: 'Crafted with 🤍 by a 🇧🇷 human in 🇩🇪, for the humans of the 🌐',
      copyright: 'Released under the MIT License. Copyright © Renato Rodrigues',
    },
  },
});

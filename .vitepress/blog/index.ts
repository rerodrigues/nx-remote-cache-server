import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { Feed } from 'feed';
import matter from 'gray-matter';
import type { HeadConfig, PageData } from 'vitepress';
import { formatPostDate, fullTitle, isPostPath, tagSlug } from './format';

export interface Post {
  title: string;
  subtitle?: string;
  url: string;
  description?: string;
  tags: { name: string; slug: string }[];
  date: { time: number; string: string };
}

export function listPostFiles(blogDir: string): string[] {
  return readdirSync(blogDir)
    .filter((name) => name.endsWith('.md') && name !== 'index.md')
    .map((name) => join(blogDir, name));
}

function parse(file: string) {
  const { data } = matter(readFileSync(file, 'utf8'));
  return { data, draft: data.draft === true };
}

export function listDraftFiles(files: string[]): string[] {
  return files.filter((file) => parse(file).draft);
}

export function readPosts(files: string[]): Post[] {
  return files
    .filter((file) => basename(file) !== 'index.md')
    .flatMap((file) => {
      const { data, draft } = parse(file);
      if (draft) return [];
      if (!data.title) throw new Error(`${file}: missing "title" in frontmatter`);
      const time = data.date ? +new Date(data.date) : NaN;
      if (Number.isNaN(time)) throw new Error(`${file}: missing or invalid "date" in frontmatter`);
      return [
        {
          title: data.title,
          subtitle: data.subtitle,
          url: `/blog/${basename(file, '.md')}`,
          description: data.description,
          tags: ((data.tags ?? []) as string[]).map((name) => ({ name, slug: tagSlug(name) })),
          date: { time, string: formatPostDate(time, 'short') },
        },
      ];
    })
    .sort((a, b) => b.date.time - a.date.time);
}

export function listTags(posts: Post[]): { name: string; slug: string }[] {
  const bySlug = new Map<string, { name: string; slug: string }>();
  for (const tag of posts.flatMap((post) => post.tags)) {
    if (!bySlug.has(tag.slug)) bySlug.set(tag.slug, tag);
  }
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export interface BlogOptions {
  blogDir: string;
  docsDir: string;
  siteUrl: string;
  siteDescription: string;
  recentInMenu?: number;
}

export function createBlog({ blogDir, docsDir, siteUrl, siteDescription, recentInMenu = 5 }: BlogOptions) {
  const files = listPostFiles(blogDir);
  const posts = readPosts(files);
  const links = posts.map((post) => ({ text: post.title, link: post.url }));
  const allPosts = { text: 'All Posts', link: '/blog/' };

  return {
    srcExclude: listDraftFiles(files).map((file) => relative(docsDir, file)),

    navItems: [...links.slice(0, recentInMenu), allPosts],

    sidebar: [{ text: 'Blog', items: [allPosts, ...links] }],

    transformPageData(pageData: PageData) {
      const { name } = pageData.params ?? {};
      if (name && pageData.relativePath.startsWith('blog/tags/')) {
        pageData.title = `Posts tagged ${name}`;
        pageData.frontmatter.description = `Cacheiro blog posts tagged ${name}.`;
      } else if (isPostPath(pageData.relativePath)) {
        pageData.title = fullTitle(pageData.title, pageData.frontmatter.subtitle);
      }
    },

    pageHead(relativePath: string, frontmatter: Record<string, any>): HeadConfig[] {
      if (!isPostPath(relativePath)) return [['meta', { property: 'og:type', content: 'website' }]];
      const head: HeadConfig[] = [['meta', { property: 'og:type', content: 'article' }]];
      if (frontmatter.date) {
        head.push([
          'meta',
          { property: 'article:published_time', content: new Date(frontmatter.date).toISOString() },
        ]);
      }
      return head;
    },

    writeFeed(outDir: string) {
      const feed = new Feed({
        title: 'Cacheiro Blog',
        description: siteDescription,
        id: `${siteUrl}blog/`,
        link: `${siteUrl}blog/`,
        language: 'en',
        copyright: 'Copyright © Renato Rodrigues',
        feedLinks: { atom: `${siteUrl}feed.xml` },
      });
      for (const post of posts) {
        const url = `${siteUrl}${post.url.slice(1)}`;
        feed.addItem({
          title: fullTitle(post.title, post.subtitle),
          id: url,
          link: url,
          description: post.description,
          date: new Date(post.date.time),
        });
      }
      writeFileSync(`${outDir}/feed.xml`, feed.atom1());
    },
  };
}

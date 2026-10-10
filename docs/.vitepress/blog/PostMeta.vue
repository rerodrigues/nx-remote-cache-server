<script setup lang="ts">
import { computed } from 'vue';
import { useData, withBase } from 'vitepress';
import { formatPostDate, isPostPath, tagUrl } from './format';

const { frontmatter, page, theme } = useData();

const isPost = computed(() => isPostPath(page.value.relativePath));
const date = computed(() => {
  const raw = frontmatter.value.date;
  if (!raw) return undefined;
  const time = +new Date(raw);
  return { iso: new Date(time).toISOString(), label: formatPostDate(time) };
});
const tags = computed<string[]>(() => frontmatter.value.tags ?? []);
</script>

<template>
  <header v-if="isPost" class="post-header">
    <h1>
      {{ frontmatter.title
      }}<template v-if="frontmatter.subtitle"
        ><span class="visually-hidden">: </span
        ><span class="post-subtitle">{{ frontmatter.subtitle }}</span></template
      >
    </h1>
    <div class="post-meta">
      <time v-if="date" :datetime="date.iso">{{ date.label }}</time>
      <span v-if="date && frontmatter.author" aria-hidden="true">&middot;</span>
      <a v-if="frontmatter.author && theme.author.url" class="post-author" :href="theme.author.url">{{
        frontmatter.author
      }}</a>
      <span v-else-if="frontmatter.author">{{ frontmatter.author }}</span>
      <ul v-if="tags.length" class="post-tags">
        <li v-for="tag in tags" :key="tag">
          <a :href="withBase(tagUrl(tag))">{{ tag }}</a>
        </li>
      </ul>
    </div>
  </header>
</template>

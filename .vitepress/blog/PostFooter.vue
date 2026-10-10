<script setup lang="ts">
import { computed } from 'vue';
import { useData, withBase } from 'vitepress';
import { isPostPath } from './format';

const { page, theme } = useData();

const isPost = computed(() => isPostPath(page.value.relativePath));
const repo = computed(() => theme.value.socialLinks?.find((link: { icon: unknown }) => link.icon === 'github')?.link);
</script>

<template>
  <aside v-if="isPost" class="post-footer">
    <h2>About Cacheiro</h2>
    <p>
      Cacheiro is a self-hosted remote cache server for Nx and Lerna with a pluggable store, supporting filesystem, S3,
      GCS and Azure, with no vendor lock-in.
    </p>
    <p class="post-footer-links">
      <a :href="withBase('/')">Home</a>
      <a :href="withBase('/guide/getting-started')">Getting started</a>
      <a v-if="repo" :href="repo">GitHub</a>
      <a href="https://www.npmjs.com/package/@renatorodrigues/cacheiro">npm</a>
    </p>
  </aside>
</template>

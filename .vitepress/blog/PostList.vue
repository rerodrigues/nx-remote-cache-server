<script setup lang="ts">
import { withBase } from 'vitepress';
import type { Post } from './index';

defineProps<{ posts: Post[] }>();
</script>

<template>
  <div class="blog-list">
    <div v-for="post in posts" :key="post.url" class="blog-card">
      <h2>
        <a :href="withBase(post.url)"
          >{{ post.title
          }}<template v-if="post.subtitle"
            ><span class="visually-hidden">: </span
            ><span class="blog-subtitle">{{ post.subtitle }}</span></template
          ></a
        >
      </h2>
      <p v-if="post.description">{{ post.description }}</p>
      <time class="blog-date" :datetime="new Date(post.date.time).toISOString()">{{ post.date.string }}</time>
    </div>
  </div>
</template>

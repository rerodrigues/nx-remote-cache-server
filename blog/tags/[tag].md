---
layout: doc
prev: false
next: false
---

<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'
import PostList from '../../.vitepress/blog/PostList.vue'
import { data as posts } from '../../.vitepress/blog/posts.data.ts'

const { params } = useData()
const tagged = computed(() => posts.filter((post) => post.tags.some((tag) => tag.slug === params.value.tag)))
</script>

# Posts tagged "{{ $params.name }}"

<PostList :posts="tagged" />

[All posts](/blog/)

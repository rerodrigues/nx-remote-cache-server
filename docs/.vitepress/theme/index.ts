import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';
import '@catppuccin/vitepress/theme/macchiato/peach.css';
import './custom.css';
import '../blog/blog.css';
import PostMeta from '../blog/PostMeta.vue';

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { 'doc-before': () => h(PostMeta) }),
};

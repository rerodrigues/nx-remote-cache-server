import { readPosts, type Post } from './index';

export type { Post };

declare const data: Post[];
export { data };

export default {
  watch: ['../../blog/*.md'],
  load: (files: string[]): Post[] => readPosts(files),
};

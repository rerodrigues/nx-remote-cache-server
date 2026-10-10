import { fileURLToPath } from 'node:url';
import { listPostFiles, listTags, readPosts } from './index';

export default {
  paths() {
    const posts = readPosts(listPostFiles(fileURLToPath(new URL('../../blog', import.meta.url))));
    return listTags(posts).map(({ name, slug }) => ({ params: { tag: slug, name } }));
  },
};

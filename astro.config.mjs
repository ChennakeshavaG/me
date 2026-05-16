// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import solid from '@astrojs/solid-js';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeMermaid from 'rehype-mermaid';

export default defineConfig({
  adapter: cloudflare(),
  integrations: [mdx(), solid()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      rehypeKatex,
      [rehypeMermaid, {
        strategy: 'inline-svg',
        mermaidConfig: {
          theme: 'dark',
          fontFamily: '"Chakra Petch", sans-serif',
        },
      }],
    ],
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid'],
      themes: {
        light: 'nord',
        dark: 'nord',
      },
    },
  },
});
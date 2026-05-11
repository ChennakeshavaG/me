import { For, createMemo } from 'solid-js';
import StreamCard from './StreamCard';
import TypeIcon from './icons/TypeIcon';
import type { Item } from './types';

const groups = ['project', 'wiki', 'blog'] as const;
const labels: Record<string, string> = { project: 'Projects', wiki: 'Wikis', blog: 'Blogs' };

export default function GroupedView(props: { items: Item[] }) {
  const grouped = createMemo(() => {
    const map: Record<string, Item[]> = { project: [], wiki: [], blog: [] };
    for (const item of props.items) map[item.type].push(item);
    return map;
  });

  return (
    <div class="grouped">
      <For each={groups}>
        {(type) => {
          const items = () => grouped()[type];
          return (
            <div class="grouped__section" data-type={type}>
              <div class="grouped__header">
                <TypeIcon type={type} />
                <span class="grouped__title">{labels[type]}</span>
                <span class="grouped__count">{items().length}</span>
              </div>
              <div class="grouped__items">
                <For each={items()}>
                  {(item) => <StreamCard item={item} />}
                </For>
                {items().length === 0 && (
                  <p class="grouped__empty">No {labels[type].toLowerCase()} yet.</p>
                )}
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}

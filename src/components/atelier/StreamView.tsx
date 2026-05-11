import { For } from 'solid-js';
import StreamCard from './StreamCard';
import type { Item } from './types';

export default function StreamView(props: { items: Item[] }) {
  return (
    <div class="stream">
      <For each={props.items}>
        {(item) => <StreamCard item={item} />}
      </For>
    </div>
  );
}

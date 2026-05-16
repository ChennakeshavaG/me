import { createSignal, For, Switch, Match } from 'solid-js';
import SearchInput from './SearchInput';
import StreamView from './StreamView';
import GraphView from './GraphView';
import GroupedView from './GroupedView';
import type { Item } from './types';

const views = ['stream', 'graph', 'grouped'] as const;
type ViewType = (typeof views)[number];

export default function AtelierHub(props: { items: Item[] }) {
  const [viewType, setViewType] = createSignal<ViewType>('stream');
  const [search, setSearch] = createSignal('');

  const filteredItems = () => {
    const q = search().toLowerCase();
    if (!q) return props.items;
    return props.items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.route.some((r) => r.label.toLowerCase().includes(q))
    );
  };

  return (
    <>
      <div class="atelier-controls-wrapper">
        <div class="atelier-controls page-width">
          <div class="atelier-views">
            <span class="atelier-controls__label">View type:</span>
            <div class="atelier-views__group" role="group" aria-label="View type">
              <For each={views}>
                {(v) => (
                  <button
                    class={`atelier-view-btn${viewType() === v ? ' atelier-view-btn--active' : ''}`}
                    aria-pressed={viewType() === v}
                    onClick={() => setViewType(v)}
                  >
                    {v}
                  </button>
                )}
              </For>
            </div>
          </div>
          <SearchInput value={search()} onInput={setSearch} />
        </div>
      </div>

      <div class="atelier-view">
        <Switch>
          <Match when={viewType() === 'stream'}>
            <StreamView items={filteredItems()} />
          </Match>
          <Match when={viewType() === 'graph'}>
            <GraphView />
          </Match>
          <Match when={viewType() === 'grouped'}>
            <GroupedView items={filteredItems()} />
          </Match>
        </Switch>
      </div>
    </>
  );
}

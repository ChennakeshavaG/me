import { For } from 'solid-js';
import TypeIcon from './icons/TypeIcon';
import PinIcon from './icons/PinIcon';
import type { Item } from './types';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return dateStr;
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 10) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function StreamCard(props: { item: Item }) {
  return (
    <div
      class={`stream-card glass${props.item.pinned ? ' stream-card--pinned' : ''}`}
      data-type={props.item.type}
    >
      <div class="stream-card__header">
        <div class="stream-card__route">
          {props.item.pinned && <span class="stream-card__pin"><PinIcon /></span>}
          <TypeIcon type={props.item.type} />
          <For each={props.item.route.filter(s => !s.isType)}>
            {(seg, i) => (
              <>
                {i() > 0 && <span class="stream-card__sep">/</span>}
                {seg.href ? (
                  <a class="stream-card__seg" href={seg.href}>
                    {seg.label}
                  </a>
                ) : (
                  <a class="stream-card__seg stream-card__seg--current" href={props.item.href}>
                    {seg.label}
                  </a>
                )}
              </>
            )}
          </For>
        </div>
        <span class="stream-card__date">{formatDate(props.item.date)}</span>
      </div>
      <p class="stream-card__desc">{props.item.description}</p>
    </div>
  );
}

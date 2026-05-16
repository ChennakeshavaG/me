import { onCleanup } from 'solid-js';

interface Props {
  value: string;
  onInput: (value: string) => void;
}

export default function SearchInput(props: Props) {
  let timeout: number | undefined;

  const handleInput = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
    const val = e.currentTarget.value;
    clearTimeout(timeout);
    timeout = window.setTimeout(() => props.onInput(val), 200);
  };

  onCleanup(() => clearTimeout(timeout));

  return (
    <div class="atelier-search">
      <div class="atelier-search__field">
        <svg class="atelier-search__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          class="atelier-search__input"
          placeholder="Search articles..."
          aria-label="Search articles"
          value={props.value}
          onInput={handleInput}
        />
      </div>
    </div>
  );
}

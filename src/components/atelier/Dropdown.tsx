import { For } from 'solid-js';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface Props {
  name: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}

export default function Dropdown(props: Props) {
  return (
    <select
      class={`atelier-select atelier-select--${props.name} glow-edge--focus`}
      value={props.value}
      onChange={(e) => props.onChange(e.currentTarget.value)}
    >
      <For each={props.options}>
        {(opt) => (
          <option value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        )}
      </For>
    </select>
  );
}

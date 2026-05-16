export default function GraphView() {
  return (
    <div class="graph-placeholder">
      <div class="graph-placeholder__icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="6" r="2" />
          <circle cx="12" cy="18" r="2" />
          <line x1="7.5" y1="7.5" x2="10.5" y2="16.5" />
          <line x1="16.5" y1="7.5" x2="13.5" y2="16.5" />
          <line x1="8" y1="6" x2="16" y2="6" />
        </svg>
      </div>
      <p class="graph-placeholder__title">Graph View</p>
      <p class="graph-placeholder__desc">
        Interactive force-directed content graph &mdash; arriving with Three.js in a future update.
      </p>
    </div>
  );
}

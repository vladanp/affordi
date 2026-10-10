/** The Affordi wordmark with its decorative logomark. */
export function Brand() {
  return (
    <p className="brand">
      <svg aria-hidden="true" className="brand-mark" focusable="false" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="16" />
        <path d="m10.5 22.5 5.5-13 5.5 13M12.5 18h7" />
      </svg>
      <span>Affordi</span>
    </p>
  );
}

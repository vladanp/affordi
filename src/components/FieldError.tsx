export function FieldError({ error, id }: { error: string | undefined; id: string }) {
  return (
    <small
      className={`field-error${error === undefined ? ' field-error-empty' : ''}`}
      aria-hidden={error === undefined}
      id={id}
    >
      {error ?? '\u00a0'}
    </small>
  );
}

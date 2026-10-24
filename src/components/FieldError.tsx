export function FieldError({ error, id }: { error: string | undefined; id: string }) {
  if (error === undefined) return null;
  return (
    <small className="field-error" id={id}>
      {error}
    </small>
  );
}

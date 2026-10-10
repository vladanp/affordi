export interface SegmentOption<Value extends string> {
  label: string;
  value: Value;
}

interface SegmentedProps<Value extends string> {
  name: string;
  onChange: (value: Value) => void;
  options: readonly SegmentOption<Value>[];
  value: string;
}

/** Radio buttons styled as a segmented control for a short list of choices. */
export function Segmented<Value extends string>({
  name,
  onChange,
  options,
  value,
}: SegmentedProps<Value>) {
  return (
    <span className="segmented">
      {options.map((option) => (
        <label className="segment" key={option.value}>
          <input
            checked={value === option.value}
            name={name}
            onChange={() => onChange(option.value)}
            type="radio"
            value={option.value}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </span>
  );
}

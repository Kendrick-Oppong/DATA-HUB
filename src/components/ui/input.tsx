import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { Minus, Plus } from "lucide-react";
import { cn } from "../../lib/utils";

type InputProps = React.ComponentProps<"input"> & {
  showNumberControls?: boolean;
};

function Input({
  className,
  type,
  showNumberControls = true,
  value,
  defaultValue,
  onChange,
  ...props
}: InputProps) {
  const isNumberInput = type === "number";

  const [internalValue, setInternalValue] = React.useState<string>(
    value !== undefined
      ? String(value)
      : defaultValue !== undefined
        ? String(defaultValue)
        : "",
  );

  const currentValue = value !== undefined ? String(value) : internalValue;

  const updateValue = (nextValue: string) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    const syntheticEvent = {
      target: {
        value: nextValue,
      },
      currentTarget: {
        value: nextValue,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange?.(syntheticEvent);
  };

  const increment = () => {
    const current = Number(currentValue || 0);
    const step = Number(props.step || 1);
    const max = props.max !== undefined ? Number(props.max) : Infinity;

    const next = Math.min(current + step, max);
    updateValue(String(next));
  };

  const decrement = () => {
    const current = Number(currentValue || 0);
    const step = Number(props.step || 1);
    const min = props.min !== undefined ? Number(props.min) : -Infinity;

    const next = Math.max(current - step, min);
    updateValue(String(next));
  };

  const input = (
    <InputPrimitive
      type={type}
      data-slot="input"
      value={value !== undefined ? value : currentValue}
      defaultValue={undefined}
      onChange={onChange}
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20",
        "md:text-sm dark:bg-input/30 dark:disabled:bg-input/80",
        "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        isNumberInput && showNumberControls && "pr-12",
        "[appearance:textfield]",
        "[&::-webkit-inner-spin-button]:appearance-none",
        "[&::-webkit-outer-spin-button]:appearance-none",
        className,
      )}
      {...props}
    />
  );

  if (!isNumberInput || !showNumberControls) {
    return input;
  }

  return (
    <div className="relative w-full">
      {input}

      <div
        className="
          absolute
          right-1
          top-1/2
          flex
          -translate-y-1/2
          flex-col
          overflow-hidden
          rounded-md
          border
          border-border
          bg-muted/60
        "
      >
        <button
          type="button"
          aria-label="Increase value"
          disabled={props.disabled}
          onClick={increment}
          className="
            flex
            h-[15px]
            w-7
            items-center
            justify-center
            text-muted-foreground
            transition-colors
            hover:bg-primary
            hover:text-primary-foreground
            disabled:pointer-events-none
            disabled:opacity-40
          "
        >
          <Plus className="h-3 w-3" strokeWidth={2.5} />
        </button>

        <div className="h-px bg-border" />

        <button
          type="button"
          aria-label="Decrease value"
          disabled={props.disabled}
          onClick={decrement}
          className="
            flex
            h-[15px]
            w-7
            items-center
            justify-center
            text-muted-foreground
            transition-colors
            hover:bg-primary
            hover:text-primary-foreground
            disabled:pointer-events-none
            disabled:opacity-40
          "
        >
          <Minus className="h-3 w-3" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export { Input };

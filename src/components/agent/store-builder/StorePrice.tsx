import React, { useState } from "react";

interface StorePriceProps {
  value: number;
  onChange: (value: number) => void;
  floor?: number;
}

export const StorePrice: React.FC<StorePriceProps> = ({ value, onChange, floor }) => {
  const [textValue, setTextValue] = useState(value.toFixed(2));

  const below = floor != null && value < floor;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextValue(val);

    // Parse and validate
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  const handleBlur = () => {
    if (floor != null && value < floor) {
      onChange(floor);
      setTextValue(floor.toFixed(2));
    } else {
      setTextValue(value.toFixed(2));
    }
  };

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all"
      style={{
        borderColor: below ? "hsl(var(--destructive))" : "hsl(var(--input))",
        background: "hsl(var(--background))",
      }}
      title={below ? "Below your cost — will snap to the floor" : undefined}
    >
      <span className="text-xs font-bold text-muted-foreground">GH₵</span>
      <input
        type="text"
        inputMode="decimal"
        value={textValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className="w-12 bg-transparent border-none outline-none text-xs font-bold font-mono tabular-nums"
        style={{
          color: below ? "hsl(var(--destructive))" : "hsl(var(--foreground))",
        }}
      />
    </div>
  );
};

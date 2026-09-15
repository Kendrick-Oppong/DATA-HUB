import React, { useState, useEffect, startTransition } from "react";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "cn";

function Slider({
  className,
  defaultValue,
  value,
  onValueChange,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  // Local state keeps slider thumb movement instantaneous (60-120 FPS)
  const [internalValue, setInternalValue] = useState(value ?? defaultValue);

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleValueChange = (
    val: number | readonly number[],
    eventDetails: SliderPrimitive.Root.ChangeEventDetails
  ) => {
    // 1. Update slider thumb position instantly
    setInternalValue(val);

    // 2. Defer heavy parent component re-renders (catalog table re-computations)
    if (onValueChange) {
      startTransition(() => {
        onValueChange(val, eventDetails);
      });
    }
  };

  const thumbCount = Array.isArray(internalValue)
    ? internalValue.length
    : Array.isArray(defaultValue)
      ? defaultValue.length
      : 1;

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full touch-none", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={internalValue}
      onValueChange={handleValueChange}
      min={min}
      max={max}
      {...props}
    >
      <SliderPrimitive.Control
        data-slot="slider-control"
        className="relative flex w-full touch-none select-none items-center py-2.5 data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col data-vertical:px-2.5 data-vertical:py-0"
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow select-none rounded-full bg-muted data-horizontal:h-1.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-1.5"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="rounded-full bg-primary data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>

        {Array.from({ length: thumbCount }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            index={thumbCount > 1 ? index : undefined}
            aria-label={
              thumbCount > 1
                ? index === 0
                  ? "Minimum value"
                  : "Maximum value"
                : "Value"
            }
            className="block size-5 cursor-grab select-none rounded-full border-2 border-primary bg-background shadow-md ring-ring/50 transition-shadow hover:ring-2 focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing active:ring-2 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };

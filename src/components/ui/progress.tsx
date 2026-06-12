import * as ProgressPrimitive from "@radix-ui/react-progress";
export function Progress({ value = 0 }: { value?: number }) {
  return <ProgressPrimitive.Root className="progress"><ProgressPrimitive.Indicator className="progress-value" style={{ transform: `translateX(-${100 - value}%)` }} /></ProgressPrimitive.Root>;
}

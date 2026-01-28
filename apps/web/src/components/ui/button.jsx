import { cn } from "../../lib/utils";

const buttonVariants = {
  default: "bg-slate-900 text-white hover:bg-slate-800",
  outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-900",
  ghost: "hover:bg-slate-100 text-slate-900",
};

export function Button({ className, variant = "default", ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
        "disabled:pointer-events-none disabled:opacity-50",
        "h-9 px-4 py-2",
        buttonVariants[variant] || buttonVariants.default,
        className
      )}
      {...props}
    />
  );
}

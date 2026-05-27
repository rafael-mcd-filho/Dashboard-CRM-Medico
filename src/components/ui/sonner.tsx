import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-right"
      closeButton
      duration={5000}
      gap={8}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: [
            "group toast",
            /* shape & color */
            "rounded-[var(--radius-lg)] border border-slate-200/80 bg-white",
            "shadow-[var(--shadow-pop)]",
            /* typography */
            "text-[13px] font-medium text-slate-800",
            /* slide-in animation (sonner injects data-state) */
            "data-[type=success]:border-l-4 data-[type=success]:border-l-clinic-green",
            "data-[type=error]:border-l-4 data-[type=error]:border-l-red-500",
            "data-[type=warning]:border-l-4 data-[type=warning]:border-l-amber-500",
            "data-[type=info]:border-l-4 data-[type=info]:border-l-clinic-blue",
          ].join(" "),
          description:   "text-[12px] text-slate-500 leading-snug",
          actionButton:  "rounded-[var(--radius-md)] bg-clinic-blue px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-clinic-blue/90",
          cancelButton:  "rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50",
          closeButton:   "rounded-[var(--radius-sm)] border border-slate-200 bg-white text-slate-400 hover:text-slate-700",
          success:       "text-clinic-green",
          error:         "text-red-600",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };

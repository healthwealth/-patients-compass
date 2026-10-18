import { ReactNode } from "react";
import { useIsMobile } from "@/lib/responsive";

interface MobileFormProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  onSubmit?: (e: React.FormEvent) => void;
}

/**
 * Mobile-optimized form component
 * Automatically adjusts spacing, font sizes, and button sizes for mobile
 */
export function MobileForm({ children, title, subtitle, onSubmit }: MobileFormProps) {
  const isMobile = useIsMobile();

  return (
    <form
      onSubmit={onSubmit}
      className={`w-full mx-auto ${isMobile ? "px-4 py-6" : "px-6 py-8"}`}
    >
      {title && (
        <div className={`mb-${isMobile ? "4" : "6"}`}>
          <h1 className={`font-bold text-${isMobile ? "2xl" : "3xl"} mb-2`}>{title}</h1>
          {subtitle && (
            <p className={`text-${isMobile ? "sm" : "base"} text-muted-foreground`}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className={`space-y-${isMobile ? "3" : "4"}`}>{children}</div>
    </form>
  );
}

interface MobileFormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

/**
 * Mobile-optimized form field wrapper
 */
export function MobileFormField({ label, error, required, children }: MobileFormFieldProps) {
  const isMobile = useIsMobile();

  return (
    <div className={`space-y-${isMobile ? "1.5" : "2"}`}>
      <label className={`block font-medium text-${isMobile ? "sm" : "base"}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className={`text-red-500 text-${isMobile ? "xs" : "sm"}`}>{error}</p>
      )}
    </div>
  );
}

interface MobileFormButtonProps {
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
}

/**
 * Mobile-optimized button for forms
 */
export function MobileFormButton({
  children,
  loading,
  disabled,
  onClick,
  variant = "primary",
}: MobileFormButtonProps) {
  const isMobile = useIsMobile();

  const baseClasses = `w-full py-${isMobile ? "2.5" : "3"} px-4 rounded-lg font-medium transition-colors text-${isMobile ? "sm" : "base"}`;

  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}

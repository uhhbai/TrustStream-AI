import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "md" | "sm";

interface ButtonBaseProps {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

interface LinkButtonProps extends ButtonBaseProps {
  href: string;
  onClick?: never;
  type?: never;
}

interface ActionButtonProps extends ButtonBaseProps {
  href?: never;
  onClick?: () => void;
  type?: "button" | "submit";
}

type ButtonProps = LinkButtonProps | ActionButtonProps;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-navy text-white hover:bg-navy/90 focus-visible:ring-navy/40 shadow-soft",
  secondary:
    "bg-trust text-white hover:bg-trust/90 focus-visible:ring-trust/40 shadow-soft",
  ghost:
    "border border-border bg-surface text-ink hover:bg-slate-50 focus-visible:ring-slate-300",
  danger:
    "bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger/40 shadow-soft"
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "h-11 px-5 text-sm",
  sm: "h-9 px-3 text-xs"
};

function baseClass(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-xl2 font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  if ("href" in props) {
    return (
      <Link href={props.href} className={baseClass(variant, size, className)}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      className={baseClass(variant, size, className)}
    >
      {children}
    </button>
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** Pixel size of the square chart mark (default 32). */
  size?: number;
  className?: string;
  /** Show the finsight wordmark beside the mark. */
  withWordmark?: boolean;
  /** Extra classes for the wordmark text. */
  wordmarkClassName?: string;
  /**
   * Use the full provided lockup image (icon + finsight text).
   * Best on dark backgrounds; skips the separate wordmark.
   */
  lockup?: boolean;
  /** Width of the lockup image when lockup=true. */
  lockupWidth?: number;
};

/** Chart bars + gold “sight” dot — matches the FinSight brand mark. */
export function BrandMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0 text-[var(--text-primary)]", className)}
      aria-hidden
    >
      <rect x="2.5" y="21" width="9" height="16.5" rx="2.5" fill="currentColor" />
      <rect x="15.5" y="13" width="9" height="24.5" rx="2.5" fill="currentColor" />
      <rect x="28.5" y="6" width="9" height="31.5" rx="2.5" fill="currentColor" />
      <circle cx="33" cy="3.8" r="3.2" fill="#F4C458" />
    </svg>
  );
}

export function BrandWordmark({
  className,
  onDark = false,
}: {
  className?: string;
  /** Use lighter “fin” for black / dark brand panels. */
  onDark?: boolean;
}) {
  return (
    <span
      className={cn(
        "font-semibold tracking-tight lowercase leading-none select-none",
        className
      )}
    >
      <span className={onDark ? "text-white/70" : "text-slate-500 dark:text-slate-400"}>
        fin
      </span>
      <span className={onDark ? "text-[#8B8DFF]" : "text-[#5D5FEF]"}>sight</span>
    </span>
  );
}

/**
 * FinSight brand — chart mark (+ optional wordmark) or full lockup image.
 */
export function BrandLogo({
  size = 32,
  className,
  withWordmark = false,
  wordmarkClassName,
  lockup = false,
  lockupWidth = 180,
  onDark = false,
}: BrandLogoProps & { onDark?: boolean }) {
  if (lockup) {
    return (
      <Image
        src="/brand/finsight-logo.png"
        alt="finsight"
        width={lockupWidth}
        height={Math.round(lockupWidth * (331 / 1024))}
        className={cn("h-auto w-auto flex-shrink-0", className)}
        style={{ width: lockupWidth, height: "auto" }}
        priority
      />
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark
        size={size}
        className={onDark ? "text-white" : undefined}
      />
      {withWordmark && (
        <BrandWordmark
          onDark={onDark}
          className={cn(
            size >= 40 ? "text-2xl" : size >= 32 ? "text-lg" : "text-base",
            wordmarkClassName
          )}
        />
      )}
    </span>
  );
}

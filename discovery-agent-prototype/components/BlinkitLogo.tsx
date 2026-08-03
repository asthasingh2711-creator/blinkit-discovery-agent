import Link from "next/link";

type BlinkitLogoProps = {
  size?: "sm" | "md" | "lg";
  /** Show wordmark next to the yellow bolt (default true) */
  showWordmark?: boolean;
  className?: string;
  href?: string | null;
};

const boltBox = {
  sm: "h-7 w-7",
  md: "h-8 w-8",
  lg: "h-9 w-9",
};

const word = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-[1.65rem]",
};

/** Signature Blinkit mark: yellow tile + lightning + blinkit wordmark. */
export function BlinkitLogo({
  size = "md",
  showWordmark = true,
  className = "",
  href = "/",
}: BlinkitLogoProps) {
  const mark = (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      aria-label="blinkit"
    >
      <span
        className={`relative inline-flex shrink-0 items-center justify-center rounded-[9px] bg-[#F8C301] shadow-[0_1px_2px_rgba(0,0,0,0.08)] ${boltBox[size]}`}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[62%] w-[62%]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13.2 3.2 6.4 13.4h4.3l-1.1 7.4 8.2-11.8h-4.5L13.2 3.2Z"
            fill="#0C831F"
          />
          <path
            d="M13.2 3.2 6.4 13.4h4.3l-1.1 7.4 8.2-11.8h-4.5L13.2 3.2Z"
            fill="#1F1F1F"
            fillOpacity="0.12"
          />
          <path
            d="M12.6 4.4 7.4 12.6h3.6l-0.85 5.6 6.4-9.1h-3.5l-0.45-4.7Z"
            fill="#0C831F"
          />
        </svg>
      </span>
      {showWordmark && (
        <span
          className={`font-extrabold lowercase leading-none tracking-tight ${word[size]}`}
        >
          <span className="text-blinkit-charcoal">blink</span>
          <span className="text-blinkit-green">it</span>
        </span>
      )}
    </span>
  );

  if (href === null) return mark;
  return (
    <Link href={href} className="inline-flex shrink-0 items-center">
      {mark}
    </Link>
  );
}

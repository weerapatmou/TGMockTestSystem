import { cn } from "@/lib/utils";

type MascotProps = {
  /** Pixel size of the square mascot. Defaults to 32. */
  size?: number;
  /**
   * `color` — full multi-color mascot, for hero / decorative use.
   * `mono` — single-color plane silhouette in `currentColor`, for tiny chrome
   * (header badge, favicons) where it sits inside a colored chip.
   */
  variant?: "color" | "mono";
  /** Accessible label. Omit for purely decorative use (defaults to aria-hidden). */
  title?: string;
  className?: string;
};

// Shared geometry on a 64×64 grid. A chunky little jet, head-on, climbing:
// rounded fuselage, broad swept wings, a horizontal tailplane, and a glass
// canopy that doubles as a smiling face.
const BODY =
  "M32 9 C36.5 9 39 15 39.5 23 C40 31 39 40 36 45 C34.5 47.5 33.3 48 32 48 C30.7 48 29.5 47.5 28 45 C25 40 24 31 24.5 23 C25 15 27.5 9 32 9 Z";
const WING_R = "M38 30 L61 38 L61 41 L38 38 Z";
const WING_L = "M26 30 L3 38 L3 41 L26 38 Z";
const TAIL_R = "M33 43 L41 47 L41 48.5 L33 46 Z";
const TAIL_L = "M31 43 L23 47 L23 48.5 L31 46 Z";

/**
 * "Jett" — the Mock Test Stat mascot.
 *
 * Minimal, rounded, cute-cool, built on the cockpit theme: violet wings, a gold
 * sparkle, and a dark glass canopy with two dot eyes and a little smile.
 * Replaces the ✈ / ✦ emoji used around the app.
 */
export function Mascot({
  size = 32,
  variant = "color",
  title,
  className,
}: MascotProps) {
  const a11y = title
    ? { role: "img" as const, "aria-label": title }
    : { "aria-hidden": true };

  if (variant === "mono") {
    return (
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="currentColor"
        className={className}
        {...a11y}
      >
        <path d={WING_L} />
        <path d={WING_R} />
        <path d={TAIL_L} />
        <path d={TAIL_R} />
        <path d={BODY} />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className={className}
      {...a11y}
    >
      <defs>
        <linearGradient id="jett-body" x1="32" y1="7" x2="32" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#cdd7e6" />
        </linearGradient>
        <linearGradient id="jett-wing" x1="3" y1="30" x2="61" y2="47" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b389ff" />
          <stop offset="1" stopColor="#8b4dff" />
        </linearGradient>
      </defs>

      {/* Wings + tailplane, tucked behind the fuselage. */}
      <path d={WING_L} fill="url(#jett-wing)" />
      <path d={WING_R} fill="url(#jett-wing)" />
      <path d={TAIL_L} fill="#7a3fe0" />
      <path d={TAIL_R} fill="#7a3fe0" />

      {/* Fuselage. */}
      <path d={BODY} fill="url(#jett-body)" />

      {/* Glass canopy = the face. */}
      <rect x="26.5" y="16" width="11" height="13" rx="5.5" fill="#0e1420" />
      <circle cx="29.7" cy="21.5" r="1.5" fill="#e8eef6" />
      <circle cx="34.3" cy="21.5" r="1.5" fill="#e8eef6" />
      <path
        d="M29.5 25 Q32 27.2 34.5 25"
        stroke="#e8eef6"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Glossy glint. */}
      <circle cx="28.8" cy="18.8" r="1.2" fill="#ffffff" fillOpacity="0.85" />

      {/* Gold sparkle (replaces the ✦). */}
      <path
        d="M51 11 L52 15.5 L56.5 16.5 L52 17.5 L51 22 L50 17.5 L45.5 16.5 L50 15.5 Z"
        fill="#e6b450"
      />
    </svg>
  );
}

/**
 * Mascot inside the themed chip used in the header — dark jet on the violet
 * accent square. Keeps the header markup tidy.
 */
export function MascotBadge({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid place-items-center rounded-lg bg-accent text-bg",
        className,
      )}
    >
      <Mascot variant="mono" size={20} />
    </span>
  );
}

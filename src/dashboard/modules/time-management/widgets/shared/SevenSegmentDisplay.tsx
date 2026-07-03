const SEGMENT_RECTS = {
  a: { x: 4, y: 1, w: 22, h: 4 },
  b: { x: 26, y: 4, w: 4, h: 20 },
  c: { x: 26, y: 26, w: 4, h: 20 },
  d: { x: 4, y: 45, w: 22, h: 4 },
  e: { x: 0, y: 26, w: 4, h: 20 },
  f: { x: 0, y: 4, w: 4, h: 20 },
  g: { x: 4, y: 23, w: 22, h: 4 },
} as const;

type Segment = keyof typeof SEGMENT_RECTS;

const DIGIT_SEGMENTS: Record<string, Segment[]> = {
  "0": ["a", "b", "c", "d", "e", "f"],
  "1": ["b", "c"],
  "2": ["a", "b", "d", "e", "g"],
  "3": ["a", "b", "c", "d", "g"],
  "4": ["b", "c", "f", "g"],
  "5": ["a", "c", "d", "f", "g"],
  "6": ["a", "c", "d", "e", "f", "g"],
  "7": ["a", "b", "c"],
  "8": ["a", "b", "c", "d", "e", "f", "g"],
  "9": ["a", "b", "c", "d", "f", "g"],
};

function SevenSegmentDigit({ digit, color }: { digit: string; color: string }) {
  const on = new Set(DIGIT_SEGMENTS[digit] ?? []);
  return (
    <svg viewBox="0 0 30 50" className="h-full w-auto shrink-0">
      {(Object.keys(SEGMENT_RECTS) as Segment[]).map((seg) => {
        const r = SEGMENT_RECTS[seg];
        return (
          <rect
            key={seg}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            rx={1}
            fill={color}
            opacity={on.has(seg) ? 1 : 0.08}
          />
        );
      })}
    </svg>
  );
}

function SevenSegmentColon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 8 50" className="h-full w-auto shrink-0">
      <circle cx={4} cy={18} r={2.5} fill={color} />
      <circle cx={4} cy={32} r={2.5} fill={color} />
    </svg>
  );
}

/**
 * Renders a string of digits and colons as a seven-segment display.
 * Non digit/colon characters are ignored.
 */
export function SevenSegmentDisplay({
  value,
  color,
  className = "h-14",
}: {
  value: string;
  color: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-stretch justify-center gap-1 ${className}`}
      aria-label={value}
    >
      {[...value].map((ch, i) =>
        ch === ":" ? (
          <SevenSegmentColon key={i} color={color} />
        ) : (
          <SevenSegmentDigit key={i} digit={ch} color={color} />
        ),
      )}
    </div>
  );
}

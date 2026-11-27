import { createIsometricCube } from "./cube";

// Generated once from the 3D cube; all faces share these projected vertices.
const CUBE = createIsometricCube({ size: 22, center: [16, 15.8] });

/** The Hardvoxel cube mark, without the wordmark or link wrapper. */
export function LogoMark({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "display";
}) {
  const classes = ["logo-mark", variant === "display" ? "logo-mark--display" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      shapeRendering="geometricPrecision"
      className={classes}
    >
      <g>
        {/* Silhouette base fills antialiasing seams; face tones create the lighting */}
        <path d={CUBE.silhouettePath} className="cube-face-base" />
        <path d={CUBE.topPath} className="cube-face-top" />
        <path d={CUBE.leftPath} className="cube-face-left" />
        <path d={CUBE.rightPath} className="cube-face-right" />
      </g>
    </svg>
  );
}

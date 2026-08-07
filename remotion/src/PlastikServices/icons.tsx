import { interpolate } from "remotion";

const draw = (progress: number, from: number, to: number) =>
  interpolate(progress, [from, to], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const pop = (progress: number, from: number, to: number) =>
  interpolate(progress, [from, (from + to) / 2, to], [0, 1.2, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

type IconProps = { progress: number };

export const SurgeryIcon: React.FC<IconProps> = ({ progress }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <path
      d="M15 85 L55 45 L80 20 L88 12 L74 10 L60 24 L48 36"
      fill="none"
      stroke="white"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={draw(progress, 0, 0.65)}
    />
    <circle
      cx="15"
      cy="85"
      r="9"
      fill="none"
      stroke="white"
      strokeWidth="6"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={draw(progress, 0.5, 1)}
      style={{
        transformOrigin: "15px 85px",
        transform: `scale(${pop(progress, 0.5, 0.85)})`,
      }}
    />
  </svg>
);

export const MedicalIcon: React.FC<IconProps> = ({ progress }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <polyline
      points="10,52 28,52 38,22 54,82 64,52 90,52"
      fill="none"
      stroke="white"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={draw(progress, 0, 0.9)}
    />
  </svg>
);

export const LogisticsIcon: React.FC<IconProps> = ({ progress }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <path
      d="M50 14 C34 14 23 26 23 41 C23 62 50 87 50 87 C50 87 77 62 77 41 C77 26 66 14 50 14 Z"
      fill="none"
      stroke="white"
      strokeWidth="6"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={draw(progress, 0, 0.75)}
    />
    <circle
      cx="50"
      cy="41"
      r="11"
      fill="white"
      opacity={pop(progress, 0.7, 1)}
      style={{
        transformOrigin: "50px 41px",
        transform: `scale(${pop(progress, 0.7, 1)})`,
      }}
    />
  </svg>
);

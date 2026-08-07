import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const CheckIcon: React.FC<{ progress: number }> = ({ progress }) => {
  const dash = interpolate(progress, [0, 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%">
      <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.22)" />
      <path
        d="M6 12.5 L10 16.5 L18 7.5"
        fill="none"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={dash}
      />
    </svg>
  );
};

export const Scene: React.FC<{
  background: string;
  icon: React.FC<{ progress: number }>;
  title: string;
  items: string[];
}> = ({ background, icon: Icon, title, items }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const iconEntrance = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.7, stiffness: 120 },
  });
  const iconRotateIn = interpolate(frame, [0, 20], [-18, 0], {
    extrapolateRight: "clamp",
  });
  const iconOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });
  const drawProgress = interpolate(frame, [4, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const idleWobble = Math.sin(frame / 12) * 4;
  const haloScale = 1 + Math.sin(frame / 10) * 0.06;

  const titleOpacity = interpolate(frame, [16, 31], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [16, 31], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bgIconOpacity = interpolate(frame, [0, 30], [0, 0.08], {
    extrapolateRight: "clamp",
  });
  const bgIconRotate = frame * 0.15;

  return (
    <AbsoluteFill
      style={{
        background,
        alignItems: "center",
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        padding: `0 ${width * 0.1}px`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: width * 0.9,
          height: width * 0.9,
          top: -width * 0.25,
          right: -width * 0.3,
          opacity: bgIconOpacity,
          transform: `rotate(${bgIconRotate}deg)`,
        }}
      >
        <Icon progress={1} />
      </div>

      <div style={{ height: "26%" }} />

      <div
        style={{
          position: "relative",
          width: width * 0.24,
          height: width * 0.24,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.14)",
            transform: `scale(${haloScale})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: width * 0.055,
            boxSizing: "border-box",
            opacity: iconOpacity,
            transform: `scale(${iconEntrance}) rotate(${
              iconRotateIn + idleWobble
            }deg)`,
          }}
        >
          <Icon progress={drawProgress} />
        </div>
      </div>

      <div
        style={{
          marginTop: width * 0.06,
          fontSize: width * 0.075,
          fontWeight: 800,
          color: "#ffffff",
          textAlign: "center",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        {title}
      </div>

      <div style={{ marginTop: width * 0.08, width: "100%" }}>
        {items.map((item, i) => {
          const start = 32 + i * 9;
          const opacity = interpolate(frame, [start, start + 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const x = interpolate(frame, [start, start + 12], [-28, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const checkProgress = interpolate(
            frame,
            [start + 4, start + 16],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: width * 0.03,
                marginBottom: width * 0.038,
                opacity,
                transform: `translateX(${x}px)`,
              }}
            >
              <div style={{ width: width * 0.055, height: width * 0.055, flexShrink: 0 }}>
                <CheckIcon progress={checkProgress} />
              </div>
              <div
                style={{
                  fontSize: width * 0.042,
                  fontWeight: 500,
                  color: "#ffffff",
                }}
              >
                {item}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

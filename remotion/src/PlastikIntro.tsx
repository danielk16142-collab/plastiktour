import { z } from "zod";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const plastikIntroSchema = z.object({
  wordmark: z.string(),
  tagline: z.string(),
});

export const PlastikIntro: React.FC<z.infer<typeof plastikIntroSchema>> = ({
  wordmark,
  tagline,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const wordmarkScale = spring({
    frame,
    fps,
    config: { damping: 200, mass: 0.6 },
  });

  const wordmarkOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const taglineOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineY = interpolate(frame, [20, 40], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ringScale = interpolate(frame, [0, 90], [1, 1.6], {
    extrapolateRight: "clamp",
  });

  const ringOpacity = interpolate(frame, [0, 20, 90], [0, 0.35, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        justifyContent: "center",
        alignItems: "center",
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: width * 0.7,
          height: width * 0.7,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.8)",
          opacity: ringOpacity,
          transform: `scale(${ringScale})`,
        }}
      />

      <div
        style={{
          textAlign: "center",
          transform: `scale(${wordmarkScale})`,
          opacity: wordmarkOpacity,
        }}
      >
        <div
          style={{
            fontSize: width * 0.09,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: -1,
            lineHeight: 1,
          }}
        >
          {wordmark}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: height / 2 + width * 0.09,
          fontSize: width * 0.028,
          fontWeight: 500,
          color: "rgba(255,255,255,0.9)",
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          textAlign: "center",
          padding: "0 40px",
        }}
      >
        {tagline}
      </div>
    </AbsoluteFill>
  );
};

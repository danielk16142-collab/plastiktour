import { z } from "zod";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Scene } from "./Scene";
import { SurgeryIcon, MedicalIcon, LogisticsIcon } from "./icons";

const TitleScene: React.FC<{ tagline: string }> = ({ tagline }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 200, mass: 0.6 } });
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const taglineOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "#ffffff",
        justifyContent: "center",
        alignItems: "center",
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <div style={{ transform: `scale(${scale})`, opacity, textAlign: "center" }}>
        <Img src={staticFile("logo.png")} style={{ width: width * 0.7 }} />
      </div>
      <div
        style={{
          position: "absolute",
          marginTop: width * 0.32,
          fontSize: width * 0.032,
          fontWeight: 600,
          color: "#4b5563",
          opacity: taglineOpacity,
          textAlign: "center",
          padding: "0 40px",
        }}
      >
        {tagline}
      </div>
    </AbsoluteFill>
  );
};

export const plastikServicesSchema = z.object({});

const TRANSITION_FRAMES = 15;

export const PlastikServices: React.FC<z.infer<typeof plastikServicesSchema>> = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={75}>
        <TitleScene tagline="Tu transformación, acompañada de principio a fin" />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence durationInFrames={105}>
        <Scene
          background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          icon={SurgeryIcon}
          title="Cirugía Plástica"
          items={[
            "Lipoescultura",
            "Aumento de senos",
            "Rinoplastia",
            "Abdominoplastia (BBL)",
          ]}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence durationInFrames={105}>
        <Scene
          background="linear-gradient(135deg, #5b73d6 0%, #8b5fb0 100%)"
          icon={MedicalIcon}
          title="Tratamientos Médicos"
          items={[
            "Valoración pre-operatoria",
            "Acompañamiento médico 24/7",
            "Clínicas certificadas",
            "Seguimiento post-operatorio",
          ]}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence durationInFrames={105}>
        <Scene
          background="linear-gradient(135deg, #4f68c9 0%, #9c58b8 100%)"
          icon={LogisticsIcon}
          title="Logística en Medellín"
          items={[
            "Traslados aeropuerto-clínica-hotel",
            "Hospedaje recomendado",
            "Acompañante personal",
            "Recorridos por la ciudad",
          ]}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence durationInFrames={75}>
        <TitleScene tagline="Agenda tu consulta hoy" />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

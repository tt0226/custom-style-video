import React from 'react';
import { z } from 'zod';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const TextVideoSchema = z.object({
  lines: z.array(z.string()),
  textColor: z.string(),
  accentColor: z.string(),
  backgroundColor: z.string(),
  musicUrl: z.string().optional(),
});

type Props = z.infer<typeof TextVideoSchema>;

const FRAMES_PER_SCENE = 90;

export const TextVideo: React.FC<Props> = ({
  lines,
  textColor,
  accentColor,
  backgroundColor,
  musicUrl,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const sceneIndex = Math.min(
    Math.floor(frame / FRAMES_PER_SCENE),
    lines.length - 1,
  );
  const frameInScene = frame % FRAMES_PER_SCENE;

  // Fade in + slide up at scene start
  const opacity = interpolate(frameInScene, [0, 18], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(frameInScene, [0, 20], [50, 0], {
    extrapolateRight: 'clamp',
  });
  // Fade out near end of scene
  const fadeOut = interpolate(frameInScene, [70, 88], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const finalOpacity = opacity * fadeOut;

  // Animated accent line width
  const lineWidth = interpolate(frameInScene, [10, 40], [0, 80], {
    extrapolateRight: 'clamp',
  });

  // Progress dots
  const dotProgress = interpolate(
    frameInScene,
    [0, FRAMES_PER_SCENE],
    [0, 1],
    { extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {musicUrl && <Audio src={musicUrl} />}

      {/* Background decorative circles */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
          top: -100,
          right: -100,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}10 0%, transparent 70%)`,
          bottom: 50,
          left: -80,
        }}
      />

      {/* Main text */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <div
          style={{
            color: textColor,
            fontSize: Math.min(width, height) * 0.1,
            fontWeight: 900,
            opacity: finalOpacity,
            transform: `translateY(${translateY}px)`,
            textAlign: 'center',
            padding: '0 80px',
            letterSpacing: '0.05em',
            lineHeight: 1.3,
            textShadow: `0 4px 40px ${accentColor}60`,
          }}
        >
          {lines[sceneIndex]}
        </div>

        {/* Accent underline */}
        <div
          style={{
            width: lineWidth,
            height: 6,
            borderRadius: 3,
            backgroundColor: accentColor,
            opacity: finalOpacity,
          }}
        />
      </div>

      {/* Scene progress dots */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        {lines.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === sceneIndex ? 28 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                i === sceneIndex ? accentColor : `${textColor}40`,
              transition: 'all 0.3s',
            }}
          />
        ))}
      </div>

      {/* Scene counter */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          right: 60,
          color: `${textColor}40`,
          fontSize: 28,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {sceneIndex + 1} / {lines.length}
      </div>
    </AbsoluteFill>
  );
};

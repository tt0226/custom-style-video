import React from 'react';
import { z } from 'zod';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const SlideVideoSchema = z.object({
  slides: z.array(
    z.object({
      text: z.string(),
      imageFile: z.string(),
    }),
  ),
  textColor: z.string(),
  overlayOpacity: z.number(),
  musicUrl: z.string().optional(),
});

type Props = z.infer<typeof SlideVideoSchema>;

const FRAMES_PER_SLIDE = 90;

const Slide: React.FC<{
  text: string;
  imageFile: string;
  textColor: string;
  overlayOpacity: number;
  isLast: boolean;
}> = ({ text, imageFile, textColor, overlayOpacity, isLast }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Ken Burns: slight zoom in
  const scale = interpolate(frame, [0, FRAMES_PER_SLIDE], [1, 1.1], {
    extrapolateRight: 'clamp',
  });

  // Slide transition: fade in at start, fade out at end
  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const fadeOut = isLast
    ? 1
    : interpolate(frame, [70, 88], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
  const opacity = fadeIn * fadeOut;

  // Text entrance
  const textOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const textY = interpolate(frame, [10, 30], [30, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Background image with Ken Burns */}
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        {imageFile ? (
          <Img
            src={imageFile}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            }}
          />
        )}
      </AbsoluteFill>

      {/* Overlay */}
      <AbsoluteFill
        style={{
          backgroundColor: `rgba(0,0,0,${overlayOpacity})`,
        }}
      />

      {/* Text */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            color: textColor,
            fontSize: 96,
            fontWeight: 900,
            textAlign: 'center',
            padding: '0 120px',
            lineHeight: 1.3,
            textShadow: '0 4px 30px rgba(0,0,0,0.8)',
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            letterSpacing: '0.05em',
          }}
        >
          {text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const SlideVideo: React.FC<Props> = ({
  slides,
  textColor,
  overlayOpacity,
  musicUrl,
}) => {
  return (
    <AbsoluteFill>
      {musicUrl && <Audio src={musicUrl} />}
      {slides.map((slide, i) => (
        <Sequence
          key={i}
          from={i * FRAMES_PER_SLIDE}
          durationInFrames={FRAMES_PER_SLIDE}
        >
          <Slide
            text={slide.text}
            imageFile={slide.imageFile}
            textColor={textColor}
            overlayOpacity={overlayOpacity}
            isLast={i === slides.length - 1}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

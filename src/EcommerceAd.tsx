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

export const EcommerceAdSchema = z.object({
  brandName: z.string(),
  tagline: z.string(),
  productName: z.string(),
  productDescription: z.string(),
  originalPrice: z.string(),
  discountPrice: z.string(),
  discountBadge: z.string(),
  productImage: z.string(),
  features: z.array(z.string()),
  ctaText: z.string(),
  primaryColor: z.string(),
  accentColor: z.string(),
  backgroundColor: z.string(),
  musicUrl: z.string().optional(),
});

type Props = z.infer<typeof EcommerceAdSchema>;

function fadeIn(frame: number, start = 0, duration = 20) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

function slideUp(frame: number, start = 0, duration = 20, distance = 40) {
  return interpolate(frame, [start, start + duration], [distance, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

// Section 1: Brand intro (0–60f = 2s)
const BrandIntro: React.FC<{
  brandName: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
}> = ({ brandName, tagline, primaryColor, accentColor, backgroundColor }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${backgroundColor} 0%, ${primaryColor}cc 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <div
        style={{
          color: '#fff',
          fontSize: 96,
          fontWeight: 900,
          letterSpacing: '-0.02em',
          opacity: fadeIn(frame, 5, 25),
          transform: `translateY(${slideUp(frame, 5, 25)}px)`,
          textShadow: `0 4px 30px ${accentColor}80`,
        }}
      >
        {brandName}
      </div>
      <div
        style={{
          color: accentColor,
          fontSize: 36,
          fontWeight: 500,
          letterSpacing: '0.15em',
          opacity: fadeIn(frame, 20, 20),
          transform: `translateY(${slideUp(frame, 20, 20)}px)`,
        }}
      >
        {tagline}
      </div>
      {/* Decorative line */}
      <div
        style={{
          width: interpolate(frame, [30, 55], [0, 200], {
            extrapolateRight: 'clamp',
          }),
          height: 3,
          backgroundColor: accentColor,
          borderRadius: 2,
          marginTop: 8,
        }}
      />
    </AbsoluteFill>
  );
};

// Section 2: Product showcase (60–240f = 6s)
const ProductShowcase: React.FC<{
  productName: string;
  productDescription: string;
  productImage: string;
  originalPrice: string;
  discountPrice: string;
  discountBadge: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
}> = ({
  productName,
  productDescription,
  productImage,
  originalPrice,
  discountPrice,
  discountBadge,
  primaryColor,
  accentColor,
  backgroundColor,
}) => {
  const frame = useCurrentFrame();

  // Ken Burns on product image
  const imgScale = interpolate(frame, [0, 180], [1, 1.08], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${backgroundColor} 0%, ${primaryColor}aa 100%)`,
        flexDirection: 'row',
      }}
    >
      {/* Left: product image */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {productImage ? (
          <Img
            src={productImage}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${imgScale})`,
              opacity: fadeIn(frame, 0, 20),
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(135deg, ${primaryColor}80, ${accentColor}40)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 120,
              opacity: 0.3,
            }}
          >
            🛍️
          </div>
        )}
        {/* Discount badge */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 40,
            backgroundColor: accentColor,
            color: '#000',
            fontSize: 32,
            fontWeight: 900,
            padding: '10px 24px',
            borderRadius: 50,
            opacity: fadeIn(frame, 15, 15),
            transform: `scale(${interpolate(frame, [15, 30], [0.5, 1], { extrapolateRight: 'clamp' })})`,
          }}
        >
          {discountBadge}
        </div>
      </div>

      {/* Right: product info */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 80px',
          gap: 24,
        }}
      >
        <div
          style={{
            color: '#fff',
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1.2,
            opacity: fadeIn(frame, 10, 25),
            transform: `translateY(${slideUp(frame, 10, 25)}px)`,
          }}
        >
          {productName}
        </div>

        <div
          style={{
            color: '#ffffffcc',
            fontSize: 30,
            lineHeight: 1.7,
            whiteSpace: 'pre-line',
            opacity: fadeIn(frame, 25, 20),
            transform: `translateY(${slideUp(frame, 25, 20)}px)`,
          }}
        >
          {productDescription}
        </div>

        {/* Price row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 20,
            marginTop: 8,
            opacity: fadeIn(frame, 35, 20),
            transform: `translateY(${slideUp(frame, 35, 20)}px)`,
          }}
        >
          <span
            style={{
              color: accentColor,
              fontSize: 88,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            {discountPrice}
          </span>
          <span
            style={{
              color: '#ffffff50',
              fontSize: 40,
              textDecoration: 'line-through',
            }}
          >
            {originalPrice}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Section 3: Features (240–360f = 4s)
const FeaturesSection: React.FC<{
  features: string[];
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
}> = ({ features, primaryColor, accentColor, backgroundColor }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${backgroundColor} 0%, ${primaryColor}cc 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 32,
        padding: '0 120px',
      }}
    >
      <div
        style={{
          color: accentColor,
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          opacity: fadeIn(frame, 0, 20),
        }}
      >
        产品特点
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          width: '100%',
          maxWidth: 900,
        }}
      >
        {features.map((feature, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              opacity: fadeIn(frame, 10 + i * 15, 20),
              transform: `translateX(${interpolate(
                frame,
                [10 + i * 15, 30 + i * 15],
                [-60, 0],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
              )}px)`,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: accentColor,
                flexShrink: 0,
              }}
            />
            <div style={{ color: '#fff', fontSize: 38, fontWeight: 500 }}>
              {feature}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Section 4: CTA (360–450f = 3s)
const CTASection: React.FC<{
  ctaText: string;
  discountPrice: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
}> = ({ ctaText, discountPrice, primaryColor, accentColor, backgroundColor }) => {
  const frame = useCurrentFrame();

  const pulse = interpolate(
    Math.sin((frame / 30) * Math.PI * 2),
    [-1, 1],
    [0.95, 1.05],
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${backgroundColor} 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 40,
      }}
    >
      <div
        style={{
          color: '#fff',
          fontSize: 52,
          fontWeight: 700,
          opacity: fadeIn(frame, 0, 20),
          letterSpacing: '0.05em',
        }}
      >
        限时特惠价
      </div>
      <div
        style={{
          color: accentColor,
          fontSize: 120,
          fontWeight: 900,
          lineHeight: 1,
          opacity: fadeIn(frame, 5, 20),
          transform: `scale(${pulse})`,
        }}
      >
        {discountPrice}
      </div>
      <div
        style={{
          backgroundColor: accentColor,
          color: '#000',
          fontSize: 52,
          fontWeight: 900,
          padding: '24px 80px',
          borderRadius: 60,
          letterSpacing: '0.08em',
          opacity: fadeIn(frame, 15, 20),
          transform: `scale(${interpolate(frame, [15, 35], [0.8, 1], {
            extrapolateRight: 'clamp',
          })})`,
          boxShadow: `0 8px 60px ${accentColor}80`,
        }}
      >
        {ctaText}
      </div>
    </AbsoluteFill>
  );
};

export const EcommerceAd: React.FC<Props> = (props) => {
  const { musicUrl } = props;
  return (
    <AbsoluteFill>
      {musicUrl && <Audio src={musicUrl} />}
      <Sequence from={0} durationInFrames={60}>
        <BrandIntro {...props} />
      </Sequence>
      <Sequence from={60} durationInFrames={180}>
        <ProductShowcase {...props} />
      </Sequence>
      <Sequence from={240} durationInFrames={120}>
        <FeaturesSection {...props} />
      </Sequence>
      <Sequence from={360} durationInFrames={90}>
        <CTASection {...props} />
      </Sequence>
    </AbsoluteFill>
  );
};

import React from "react";
import Svg, {
  Path,
  G,
  Defs,
  Pattern,
  Circle,
  ClipPath,
  Ellipse,
} from "react-native-svg";

export function Lotus({
  size = 52,
  color = "#2B6A51",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 90"
      fill="none"
      stroke={color}
      strokeWidth="2.4"
    >
      <Path d="M50 70C24 52 38 24 50 9C64 28 75 52 50 70Z" />
      <Path d="M50 70C24 70 15 49 13 32C35 34 49 46 50 70ZM50 70C76 70 85 49 87 32C65 34 51 46 50 70Z" />
      <Path d="M50 73C25 83 9 66 5 52C24 50 39 56 50 73ZM50 73C75 83 91 66 95 52C76 50 61 56 50 73ZM34 83Q50 89 66 83" />
    </Svg>
  );
}

export function LeafArt({
  size = 260,
  stage = 5,
  variant = 0,
}: {
  size?: number;
  stage?: number;
  variant?: number;
}) {
  const outline = "M48 280C18 162 69 52 253 17C260 163 190 274 48 280Z";
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 300 310"
      accessibilityLabel="طرح برگ زنتنگل"
    >
      <Defs>
        <Pattern
          id={`lines${variant}`}
          width="13"
          height="13"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(32)"
        >
          <Path d="M0 0V13M5 0V13" stroke="#27352E" strokeWidth="1" />
        </Pattern>
        <Pattern
          id={`petals${variant}`}
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <Path
            d="M16 0Q0 16 16 32Q32 16 16 0ZM0 16Q16 0 32 16Q16 32 0 16Z"
            fill="none"
            stroke="#27352E"
            strokeWidth="1.2"
          />
          <Circle cx="16" cy="16" r="3" fill="#27352E" />
        </Pattern>
        <Pattern
          id={`waves${variant}`}
          width="30"
          height="30"
          patternUnits="userSpaceOnUse"
        >
          <Path
            d="M0 30Q0 0 30 0M5 30Q5 5 30 5M10 30Q10 10 30 10M15 30Q15 15 30 15M20 30Q20 20 30 20"
            stroke="#27352E"
            strokeWidth="1"
            fill="none"
          />
        </Pattern>
        <ClipPath id={`leaf${variant}`}>
          <Path d={outline} />
        </ClipPath>
      </Defs>
      <G transform={variant % 2 ? "translate(295 0) scale(-1 1)" : undefined}>
        <Path d={outline} fill="#FAF5E9" stroke="#27352E" strokeWidth="2" />
        <G clipPath={`url(#leaf${variant})`}>
          {stage >= 3 && (
            <>
              <Path
                d="M48 280L105 213L21 177L12 243Z"
                fill={`url(#lines${variant})`}
              />
              <Path
                d="M144 158L99 47L37 108L105 213Z"
                fill={`url(#lines${variant})`}
              />
              <Path d="M187 103L194 9L269 4Z" fill={`url(#lines${variant})`} />
            </>
          )}
          {stage >= 4 && (
            <>
              <Path
                d="M105 213L275 211L200 290L48 280Z"
                fill={`url(#petals${variant})`}
              />
              <Path
                d="M187 103L289 102L275 211L144 158Z"
                fill={`url(#waves${variant})`}
              />
              <Path
                d="M144 158L99 47L194 9L187 103Z"
                fill={`url(#petals${variant})`}
              />
            </>
          )}
          {stage >= 2 && (
            <Path
              d="M48 280L253 17M105 213L21 177M105 213L275 211M144 158L99 47M144 158L283 159M187 103L194 9M187 103L279 102"
              fill="none"
              stroke="#27352E"
              strokeWidth="2.3"
            />
          )}
          {stage >= 5 && (
            <Path
              d="M60 266Q188 249 243 42M40 256Q30 150 104 76"
              stroke="#6B806A"
              strokeWidth="3"
              opacity="0.45"
              fill="none"
            />
          )}
        </G>
        <Path
          d="M37 299Q144 174 253 17"
          stroke="#27352E"
          strokeWidth="2.5"
          fill="none"
        />
      </G>
    </Svg>
  );
}

export function Botanical({ size = 160 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 150 180">
      <Path
        d="M65 175Q100 77 64 9"
        fill="none"
        stroke="#8DAB8F"
        strokeWidth="2"
      />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <G
          key={i}
          transform={`translate(${74 + Math.sin(i) * 5} ${25 + i * 23})`}
        >
          <Ellipse
            cx="-17"
            cy="-4"
            rx="22"
            ry="9"
            fill={i % 2 ? "#B1BFA2" : "#97B29A"}
            opacity="0.55"
            transform="rotate(35)"
          />
          <Ellipse
            cx="17"
            cy="-9"
            rx="22"
            ry="9"
            fill="#A8B99B"
            opacity="0.5"
            transform="rotate(-45)"
          />
        </G>
      ))}
    </Svg>
  );
}

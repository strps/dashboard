"use client";

import React, { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useAnimationFrame,
  type MotionValue,
} from "motion/react";

export type MotionPattern = "spring" | "ease" | "direct";

interface SVGCirclesProps {
  className?: string;
  width?: number;
  height?: number;
  numCircles?: number;
  minRadius?: number;
  maxRadius?: number;
  strokeWidth?: number;
  strokeColor?: string;
  strokeDasharray?: string;
  motionPattern?: MotionPattern;
  style?: React.CSSProperties;
}

interface ParallaxCircleProps {
  followX: MotionValue<number>;
  followY: MotionValue<number>;
  factor: number;
  radius: number;
  strokeWidth: number;
  strokeColor: string;
  strokeDasharray: string;
  rotation: {
    initial: number;
    animate: { rotate: number[] };
    transition: { duration: number; repeat: number; ease: "linear" };
  };
}

function usePointerFollow(pattern: MotionPattern) {
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);

  // spring — always created (hooks can't be conditional)
  const springX = useSpring(targetX, { stiffness: 50, damping: 20 });
  const springY = useSpring(targetY, { stiffness: 50, damping: 20 });

  // ease — exponential lerp each frame
  const lerpX = useMotionValue(0);
  const lerpY = useMotionValue(0);
  useAnimationFrame(() => {
    lerpX.set(lerpX.get() + (targetX.get() - lerpX.get()) * 0.1);
    lerpY.set(lerpY.get() + (targetY.get() - lerpY.get()) * 0.1);
  });

  const followX = pattern === "spring" ? springX : pattern === "ease" ? lerpX : targetX;
  const followY = pattern === "spring" ? springY : pattern === "ease" ? lerpY : targetY;

  const setTarget = (x: number, y: number) => {
    targetX.set(x);
    targetY.set(y);
  };

  return { followX, followY, setTarget };
}

function ParallaxCircle({
  followX,
  followY,
  factor,
  radius,
  strokeWidth,
  strokeColor,
  strokeDasharray,
  rotation,
}: ParallaxCircleProps) {
  const cx = useTransform(followX, (x) => x * factor);
  const cy = useTransform(followY, (y) => y * factor);

  return (
    <motion.circle
      cx={cx}
      cy={cy}
      initial={{ rotate: rotation.initial }}
      animate={rotation.animate}
      transition={rotation.transition}
      r={radius}
      fill="none"
      stroke={strokeColor}
      strokeWidth={`${strokeWidth}px`}
      pathLength="100"
      strokeDasharray={strokeDasharray}
      suppressHydrationWarning
    />
  );
}

const CirclesRenderer: React.FC<SVGCirclesProps> = ({
  width,
  height,
  numCircles,
  minRadius,
  maxRadius,
  strokeWidth,
  strokeDasharray,
  strokeColor = "grey",
  motionPattern = "spring",
  className,
  style,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { followX, followY, setTarget } = usePointerFollow(motionPattern);

  const circleRotations = useState(() =>
    Array.from({ length: numCircles! }).map(() => {
      const initialRotation = Math.random() * 360;
      const duration = Math.random() * 1 + 120;
      const direction = Math.random() < 0.5 ? 1 : -1;

      return {
        initial: initialRotation,
        animate: { rotate: [initialRotation, initialRotation + 360 * direction] },
        transition: { duration, repeat: Infinity, ease: "linear" as const },
      };
    })
  )[0];

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * (width! / rect.width);
    const y = (e.clientY - rect.top - rect.height / 2) * (height! / rect.height);
    setTarget(x, y);
  };

  return (
    <svg
      ref={svgRef}
      style={style}
      className={className}
      viewBox={`${-width! / 2} ${-height! / 2} ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setTarget(0, 0)}
    >
      {circleRotations.map((rotation, i) => {
        const radius = minRadius! + ((maxRadius! - minRadius!) * i) / (numCircles! - 1);
        const factor = ((numCircles! - i) / numCircles!) * 0.07;
        return (
          <ParallaxCircle
            key={i}
            followX={followX}
            followY={followY}
            factor={factor}
            radius={radius}
            strokeWidth={strokeWidth!}
            strokeColor={strokeColor}
            strokeDasharray={strokeDasharray!}
            rotation={rotation}
          />
        );
      })}
    </svg>
  );
};

const SVGCircles: React.FC<SVGCirclesProps> = (props) => {
  const {
    numCircles = 9,
    width = 150,
    height = 150,
    minRadius = 20,
    maxRadius = 80,
    strokeWidth = 5,
    strokeDasharray = "75",
    ...rest
  } = props;

  return (
    <CirclesRenderer
      key={numCircles}
      numCircles={numCircles}
      width={width}
      height={height}
      minRadius={minRadius}
      maxRadius={maxRadius}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      {...rest}
    />
  );
};

export default SVGCircles;

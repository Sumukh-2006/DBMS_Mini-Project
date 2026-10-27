// components/Skeleton.js
import React from 'react';

export default function Skeleton({
  width = '100%',
  height = '20px',
  radius = '8px',
  style = {},
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: '#ebeae8',
        animation: 'skeletonPulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

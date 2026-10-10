import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

/** Kanga-inspired repeating motif (diamond + dot). Drop it inside any overflow-hidden card. */
export default function KangaPattern({ color = '#fff', opacity = 0.16 }: { color?: string; opacity?: number }) {
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 15; c++) {
      const x = c * 28 + (r % 2 ? 14 : 0);
      const y = r * 24;
      cells.push(
        <Path key={`d${r}-${c}`} d={`M${x} ${y - 9} L${x + 9} ${y} L${x} ${y + 9} L${x - 9} ${y} Z`} stroke={color} strokeWidth={1.4} fill="none" />,
        <Circle key={`c${r}-${c}`} cx={x} cy={y} r={2} fill={color} />,
      );
    }
  }
  return (
    <Svg pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]} viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice">
      {cells}
    </Svg>
  );
}

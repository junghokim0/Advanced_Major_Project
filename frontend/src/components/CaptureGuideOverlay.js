import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, Mask, Rect } from 'react-native-svg';
import { resolveGuideEllipse } from '../constants/guideLayouts';

export default function CaptureGuideOverlay({ width, height, guide }) {
  if (!width || !height || !guide) {
    return null;
  }

  const { cx, cy, rx, ry } = resolveGuideEllipse(guide, width, height);
  const dimColor = `rgba(0,0,0,${guide.dimOpacity ?? 0.38})`;
  const hint = guide.hint;

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <Mask id="guideHole">
            <Rect x={0} y={0} width={width} height={height} fill="white" />
            <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="black" />
          </Mask>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill={dimColor} mask="url(#guideHole)" />
        <Ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          stroke={guide.strokeColor}
          strokeWidth={guide.strokeWidth ?? 2}
          fill="transparent"
        />
      </Svg>
      {hint ? <Text style={[styles.hint, { top: Math.max(8, cy - ry - 36) }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  hint: {
    position: 'absolute',
    left: 16,
    right: 16,
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

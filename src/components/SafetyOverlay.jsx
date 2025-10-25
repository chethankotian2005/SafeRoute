/**
 * SafetyOverlay Component
 * SVG overlay showing AI safety analysis on street view images
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Circle, Path, Text as SvgText, G } from 'react-native-svg';

const SafetyOverlay = ({ analysis, width = 600, height = 400 }) => {
  if (!analysis || analysis.error) {
    return null;
  }

  const { safetyScore, lighting, sidewalk, crowdDensity, isolation } = analysis;

  // Color based on overall safety score
  const overlayColor = safetyScore.color;
  const overlayOpacity = 0.2;

  // Calculate positions
  const badgeSize = 60;
  const badgeX = width - badgeSize - 10;
  const badgeY = 10;

  const iconSize = 24;
  const iconSpacing = 30;
  const bottomY = height - 40;

  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      {/* Overall safety tint */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={overlayColor}
        opacity={overlayOpacity}
      />

      {/* Safety score badge */}
      <G>
        {/* Badge background */}
        <Circle
          cx={badgeX + badgeSize / 2}
          cy={badgeY + badgeSize / 2}
          r={badgeSize / 2}
          fill={overlayColor}
          opacity={0.9}
        />
        {/* Score text */}
        <SvgText
          x={badgeX + badgeSize / 2}
          y={badgeY + badgeSize / 2 - 8}
          fontSize={20}
          fontWeight="bold"
          fill="#FFFFFF"
          textAnchor="middle"
        >
          {safetyScore.overall.toFixed(1)}
        </SvgText>
        {/* Grade text */}
        <SvgText
          x={badgeX + badgeSize / 2}
          y={badgeY + badgeSize / 2 + 12}
          fontSize={10}
          fill="#FFFFFF"
          textAnchor="middle"
        >
          {safetyScore.grade}
        </SvgText>
      </G>

      {/* Bottom indicator bar showing sidewalk presence */}
      {sidewalk && sidewalk.detected && (
        <Rect
          x={0}
          y={height - 8}
          width={width}
          height={8}
          fill="#4CAF50"
          opacity={0.7}
        />
      )}

      {/* Feature indicators at bottom */}
      <G>
        {/* Lighting indicator */}
        {lighting && lighting.score >= 6 && (
          <G transform={`translate(10, ${bottomY})`}>
            <Circle cx={iconSize / 2} cy={iconSize / 2} r={iconSize / 2} fill="#FFC107" opacity={0.9} />
            {/* Light bulb icon */}
            <Path
              d={`M${iconSize / 2 - 4},${iconSize / 2 - 8} L${iconSize / 2 + 4},${iconSize / 2 - 8} L${iconSize / 2 + 4},${iconSize / 2} L${iconSize / 2 - 4},${iconSize / 2} Z M${iconSize / 2 - 2},${iconSize / 2} L${iconSize / 2 + 2},${iconSize / 2} L${iconSize / 2 + 2},${iconSize / 2 + 6} L${iconSize / 2 - 2},${iconSize / 2 + 6} Z`}
              fill="#FFF"
            />
          </G>
        )}

        {/* Pedestrian/crowd indicator */}
        {crowdDensity && crowdDensity.density !== 'low' && (
          <G transform={`translate(${10 + iconSpacing}, ${bottomY})`}>
            <Circle cx={iconSize / 2} cy={iconSize / 2} r={iconSize / 2} fill="#2196F3" opacity={0.9} />
            {/* Person icon */}
            <Circle cx={iconSize / 2} cy={iconSize / 2 - 4} r={3} fill="#FFF" />
            <Path
              d={`M${iconSize / 2},${iconSize / 2 - 1} L${iconSize / 2},${iconSize / 2 + 6} M${iconSize / 2 - 4},${iconSize / 2 + 2} L${iconSize / 2 + 4},${iconSize / 2 + 2}`}
              stroke="#FFF"
              strokeWidth={2}
              fill="none"
            />
          </G>
        )}

        {/* Warning indicator for isolated areas */}
        {isolation && isolation.isolated && (
          <G transform={`translate(${10 + iconSpacing * 2}, ${bottomY})`}>
            <Circle cx={iconSize / 2} cy={iconSize / 2} r={iconSize / 2} fill="#FF5252" opacity={0.9} />
            {/* Warning triangle */}
            <Path
              d={`M${iconSize / 2},${iconSize / 2 - 6} L${iconSize / 2 + 6},${iconSize / 2 + 6} L${iconSize / 2 - 6},${iconSize / 2 + 6} Z`}
              fill="#FFF"
            />
            <SvgText
              x={iconSize / 2}
              y={iconSize / 2 + 4}
              fontSize={10}
              fontWeight="bold"
              fill="#FF5252"
              textAnchor="middle"
            >
              !
            </SvgText>
          </G>
        )}

        {/* Sidewalk indicator */}
        {sidewalk && sidewalk.detected && (
          <G transform={`translate(${10 + iconSpacing * 3}, ${bottomY})`}>
            <Circle cx={iconSize / 2} cy={iconSize / 2} r={iconSize / 2} fill="#4CAF50" opacity={0.9} />
            {/* Footpath icon - simplified */}
            <Rect
              x={iconSize / 2 - 6}
              y={iconSize / 2 + 2}
              width={12}
              height={4}
              fill="#FFF"
            />
          </G>
        )}
      </G>

      {/* Top-left lighting quality indicator */}
      {lighting && (
        <G>
          <Rect
            x={10}
            y={10}
            width={100}
            height={25}
            rx={12.5}
            fill="#000"
            opacity={0.6}
          />
          <SvgText
            x={60}
            y={27}
            fontSize={12}
            fill="#FFF"
            textAnchor="middle"
          >
            {lighting.level === 'bright' ? '☀️ Bright' : 
             lighting.level === 'moderate' ? '🌤 Moderate' : 
             '🌙 Poor Light'}
          </SvgText>
        </G>
      )}

      {/* Gradient overlay for poorly lit areas */}
      {lighting && lighting.score < 4 && (
        <Rect
          x={0}
          y={height * 0.7}
          width={width}
          height={height * 0.3}
          fill="#000"
          opacity={0.3}
        />
      )}

      {/* Highlight well-lit areas */}
      {lighting && lighting.score >= 7 && (
        <Rect
          x={0}
          y={0}
          width={width}
          height={height * 0.3}
          fill="#FFD700"
          opacity={0.15}
        />
      )}
    </Svg>
  );
};

const styles = StyleSheet.create({
  // Styles moved to inline for SVG
});

export default SafetyOverlay;

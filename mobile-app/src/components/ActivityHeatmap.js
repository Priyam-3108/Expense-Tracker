// mobile-app/src/components/ActivityHeatmap.js
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const CELL = 12;
const GAP = 3;
const WEEKDAYS = ['M', '', 'W', '', 'F', '', ''];

// Blend two hex colours (#rrggbb) by t in [0,1]
function blend(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const p = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${p.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export default function ActivityHeatmap({ grid = [], monthLabels = [], onCellPress }) {
  const { colors } = useTheme();
  // bucket palette: 0 = faint, 4 = primary
  const base = typeof colors.primary === 'string' && colors.primary.startsWith('#') ? colors.primary : '#6366F1';
  const empty = typeof colors.border === 'string' && colors.border.startsWith('#') ? colors.border : '#E2E8F0';
  const palette = [empty, blend(empty, base, 0.4), blend(empty, base, 0.65), blend(empty, base, 0.85), base];

  const colStride = CELL + GAP;
  const numCols = grid.length;

  return (
    <View>
      {/* Month labels */}
      <View style={{ flexDirection: 'row', marginLeft: 18, height: 12, marginBottom: 2 }}>
        <View style={{ width: numCols * colStride }}>
          {monthLabels.map(({ colIndex, label }) => (
            <Text
              key={colIndex}
              style={[styles.monthLabel, { color: colors.subText, position: 'absolute', left: colIndex * colStride }]}
            >
              {label}
            </Text>
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row' }}>
        {/* Fixed weekday labels */}
        <View style={{ justifyContent: 'space-between', height: 7 * colStride - GAP, marginRight: 4 }}>
          {WEEKDAYS.map((d, i) => (
            <Text key={i} style={[styles.weekdayLabel, { color: colors.subText, height: CELL }]}>{d}</Text>
          ))}
        </View>

        {/* Scrollable grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: GAP }}>
            {grid.map((week, col) => (
              <View key={col} style={{ gap: GAP }}>
                {week.map((cell, row) => (
                  <Pressable
                    key={row}
                    onPress={() => cell.date && cell.count > 0 && onCellPress && onCellPress(cell)}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 2,
                      backgroundColor: cell.inWindow ? palette[cell.bucket] : 'transparent',
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6, marginLeft: 18 }}>
        <Text style={[styles.legendText, { color: colors.subText }]}>Less</Text>
        {palette.map((c, i) => (
          <View key={i} style={{ width: CELL, height: CELL, borderRadius: 2, backgroundColor: c }} />
        ))}
        <Text style={[styles.legendText, { color: colors.subText }]}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  monthLabel: { fontSize: 10 },
  weekdayLabel: { fontSize: 9 },
  legendText: { fontSize: 10 },
});

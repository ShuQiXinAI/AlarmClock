import React, { useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { COLORS } from '../theme/colors';

const ITEM_HEIGHT = 52;
const VISIBLE_ITEMS = 3;
const COLUMN_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const VERTICAL_PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);

interface Props {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  width?: number;
}

export default function WheelPicker({
  values,
  value,
  onChange,
  format,
  width = 88,
}: Props) {
  const ref = useRef<ScrollView>(null);
  const userScrolledRef = useRef(false);
  const initializedRef = useRef(false);
  const selectedIndex = Math.max(0, values.indexOf(value));

  useEffect(() => {
    if (!initializedRef.current) return;
    // Skip when the value change was caused by the user's own scroll —
    // scrolling there would fight their gesture / cause a wiggle.
    if (userScrolledRef.current) {
      userScrolledRef.current = false;
      return;
    }
    ref.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: true });
  }, [selectedIndex]);

  const onLayout = () => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    ref.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const idx = Math.round(offsetY / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    const newValue = values[clamped];
    if (newValue !== value) {
      userScrolledRef.current = true;
      onChange(newValue);
    }
  };

  return (
    <View style={[styles.container, { width, height: COLUMN_HEIGHT }]}>
      <View pointerEvents="none" style={styles.centerBand} />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: VERTICAL_PADDING }}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onLayout={onLayout}
        nestedScrollEnabled
      >
        {values.map((v) => {
          const isSelected = v === value;
          return (
            <Pressable
              key={v}
              style={styles.item}
              onPress={() => onChange(v)}
            >
              <Text style={[styles.text, isSelected && styles.textSelected]}>
                {format ? format(v) : v}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    color: COLORS.textMuted,
    opacity: 0.35,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  textSelected: {
    fontSize: 40,
    color: COLORS.primary,
    opacity: 1,
    fontWeight: '700',
  },
  centerBand: {
    position: 'absolute',
    top: VERTICAL_PADDING,
    height: ITEM_HEIGHT,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
  },
});

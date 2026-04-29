import React from 'react';
import { Pressable, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

interface Props { value: boolean; onChange: (v: boolean) => void; }

export default function ToggleSwitch({ value, onChange }: Props) {
  const translateX = React.useRef(new Animated.Value(value ? 20 : 2)).current;

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? 20 : 2,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [value]);

  return (
    <Pressable
      testID="toggle-switch"
      onPress={() => onChange(!value)}
      style={[styles.track, { backgroundColor: value ? COLORS.primary : '#d0cce8' }]}
    >
      <Animated.View style={[styles.knob, { transform: [{ translateX }] }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track:  { width: 44, height: 26, borderRadius: 13, position: 'relative' },
  knob:   { position: 'absolute', top: 2, width: 22, height: 22, borderRadius: 11,
             backgroundColor: 'white', elevation: 2,
             shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
});

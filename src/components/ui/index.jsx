import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { RADIUS } from '../../theme/themes';

// ─── Button (shadcn: default / secondary / outline / ghost) ───
export function Button({ title, onPress, variant = 'default', size = 'md', style, textStyle, disabled }) {
  const { colors } = useTheme();
  const v = {
    default: { bg: colors.primary, fg: colors.primaryForeground, border: 'transparent' },
    secondary: { bg: colors.secondary, fg: colors.secondaryForeground, border: 'transparent' },
    outline: { bg: 'transparent', fg: colors.foreground, border: colors.input },
    ghost: { bg: 'transparent', fg: colors.foreground, border: 'transparent' },
  }[variant];
  const h = size === 'sm' ? 36 : size === 'lg' ? 52 : 44;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: colors.accent }}
      style={({ pressed }) => [
        styles.btn,
        { height: h, backgroundColor: v.bg, borderColor: v.border, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === 'ghost' && pressed && { backgroundColor: colors.accent },
        style,
      ]}
    >
      <Text style={[styles.btnText, { color: v.fg, fontSize: size === 'sm' ? 14 : 15 }, textStyle]}>{title}</Text>
    </Pressable>
  );
}

// ─── Card ───
export function Card({ children, style }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

export function CardTitle({ children, description }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: colors.cardForeground, fontSize: 16, fontWeight: '600' }}>{children}</Text>
      {description ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 2 }}>{description}</Text>
      ) : null}
    </View>
  );
}

export function Label({ children, style }) {
  const { colors } = useTheme();
  return (
    <Text style={[{ color: colors.mutedForeground, fontSize: 13, fontWeight: '500', marginBottom: 8 }, style]}>
      {children}
    </Text>
  );
}

export function Separator({ style }) {
  const { colors } = useTheme();
  return <View style={[{ height: 1, backgroundColor: colors.border, marginVertical: 16 }, style]} />;
}

// ─── Segmented (shadcn Tabs / ToggleGroup single) ───
export function Segmented({ options, value, onChange }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.segWrap, { backgroundColor: colors.muted }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            style={[
              styles.segItem,
              active && { backgroundColor: colors.background, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth },
            ]}
          >
            <Text style={{ color: active ? colors.foreground : colors.mutedForeground, fontSize: 14, fontWeight: '500' }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Chip (shadcn Toggle) ───
export function Chip({ label, selected, onPress }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: selected ? colors.primary : colors.input, backgroundColor: selected ? colors.primary : 'transparent' },
      ]}
    >
      <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontSize: 14, fontWeight: '500' }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  btnText: { fontWeight: '600' },
  card: { borderRadius: RADIUS.xl, borderWidth: 1, padding: 20 },
  segWrap: { flexDirection: 'row', padding: 4, borderRadius: RADIUS.lg, gap: 2 },
  segItem: { flex: 1, height: 36, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', borderWidth: 0 },
  chip: { height: 38, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

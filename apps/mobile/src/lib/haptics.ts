import * as Haptics from "expo-haptics";

// expo-haptics is a no-op on web at runtime, but the import is still
// fine — keep this thin wrapper so call sites stay readable and we have
// one place to swap in custom patterns later.

const isNative = process.env.EXPO_OS !== "web";

export const haptics = {
  /** Light tap, e.g. send button, toggle on. */
  light() {
    if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  /** Medium tap, e.g. job start, primary CTA. */
  medium() {
    if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  /** Heavy tap, e.g. destructive confirm. */
  heavy() {
    if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  /** Notify success after an async action completes. */
  success() {
    if (isNative)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  /** Notify error after a failed action. */
  error() {
    if (isNative)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
};

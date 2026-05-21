import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const native = Platform.OS !== 'web';

export const hapticSwipe   = () => { if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);   };
export const hapticMerge   = () => { if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);  };
export const hapticUnlock  = () => { if (native) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); };
export const hapticGameOver = () => { if (native) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);   };

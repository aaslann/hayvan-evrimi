/**
 * AdMob wrapper — çalışma zamanı (runtime) require kullanır; web'de hiçbir şey yapmaz.
 * EAS Build olmadan (Expo Go / web) reklamlar gösterilmez — bu normaldir.
 *
 * TODO: production'a geçmeden önce TEST ID'lerini gerçek AdMob ID'leriyle değiştir.
 */
import { Platform } from 'react-native';

const isNative = Platform.OS !== 'web';

// ── App ID'leri (app.json'da da tanımlanıyor) ─────────────────────────────────
export const ADMOB_APP_ID = Platform.select({
  ios: 'ca-app-pub-3940256099942544~1458002511',     // TEST — gerçeğiyle değiştir
  android: 'ca-app-pub-3940256099942544~3347511713', // TEST — gerçeğiyle değiştir
}) ?? '';

// ── Ad Unit ID'leri ───────────────────────────────────────────────────────────
const BANNER_ID = Platform.select({
  ios: 'ca-app-pub-3940256099942544/2934735716',     // TEST banner
  android: 'ca-app-pub-3940256099942544/6300978111', // TEST banner
}) ?? '';

const REWARDED_ID = Platform.select({
  ios: 'ca-app-pub-3940256099942544/1712485313',     // TEST rewarded
  android: 'ca-app-pub-3940256099942544/5224354917', // TEST rewarded
}) ?? '';

// ── Lazy native module yükleme ────────────────────────────────────────────────
let _ads: any = null;
const getAds = () => {
  if (!isNative) return null;
  if (!_ads) {
    try { _ads = require('react-native-google-mobile-ads'); } catch {}
  }
  return _ads;
};

// ── SDK başlatma ──────────────────────────────────────────────────────────────
export const initAds = async (): Promise<void> => {
  const ads = getAds();
  if (!ads) return;
  try {
    await ads.default().initialize();
  } catch {}
};

// ── Rewarded Ad — ödül kazanıldıysa true döner ───────────────────────────────
export const showRewardedAd = (): Promise<boolean> => {
  const ads = getAds();
  if (!ads) return Promise.resolve(false);

  return new Promise((resolve) => {
    try {
      const { RewardedAd, RewardedAdEventType, AdEventType } = ads;
      const ad = RewardedAd.createForAdRequest(REWARDED_ID, {
        requestNonPersonalizedAdsOnly: true,
      });

      let earned   = false;
      let settled  = false;
      const settle = (val: boolean) => { if (!settled) { settled = true; resolve(val); } };

      ad.addAdEventListener(RewardedAdEventType.LOADED,        () => ad.show());
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => { earned = true; });
      ad.addAdEventListener(AdEventType.CLOSED,                () => settle(earned));
      ad.addAdEventListener(AdEventType.ERROR,                 () => settle(false));

      ad.load();
    } catch {
      resolve(false);
    }
  });
};

// ── BannerAd bileşeni — web'de null döner ─────────────────────────────────────
export { BannerAdView } from '../components/BannerAdView';
export { BANNER_ID };

/**
 * Web stub — reklamlar yalnızca native (iOS/Android) build'de çalışır.
 * Metro bu dosyayı web platformu için seçer; ads.native.ts iOS/Android için seçilir.
 */
export const initAds = async (): Promise<void> => {};
export const showRewardedAd = (): Promise<boolean> => Promise.resolve(false);
export { BannerAdView } from '../components/BannerAdView';
export const BANNER_ID = '';

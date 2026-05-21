/**
 * RevenueCat satın alma sarmalayıcı.
 * Web'de ve EAS Build olmayan ortamlarda sessizce devre dışı.
 *
 * Kurulum adımları:
 *  1. https://app.revenuecat.com adresinden proje oluştur
 *  2. "remove_ads" identifier'lı bir entitlement ekle
 *  3. Aşağıdaki RC_KEY sabitlerini gerçek API anahtarlarıyla değiştir
 *  4. App Store / Play Console'da "$X Reklamsız Oyna" ürününü oluştur
 *  5. RevenueCat'te offering ve package'ı yapılandır
 */
import { Platform } from 'react-native';

// TODO: Gerçek RevenueCat API anahtarlarını buraya ekle
const RC_KEY = Platform.select({
  ios: 'appl_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',      // RevenueCat iOS key
  android: 'goog_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',  // RevenueCat Android key
}) ?? '';

export const ENTITLEMENT_ID = 'remove_ads';

// ── Lazy native module ────────────────────────────────────────────────────────
let _rc: any = null;
const getRC = () => {
  if (Platform.OS === 'web') return null;
  if (!_rc) {
    try { _rc = require('react-native-purchases').default; } catch {}
  }
  return _rc;
};

// ── SDK başlatma ──────────────────────────────────────────────────────────────
export const initPurchases = (): void => {
  const rc = getRC();
  if (!rc) return;
  try {
    rc.configure({ apiKey: RC_KEY });
  } catch {}
};

// ── Reklamsız durumu kontrol et ───────────────────────────────────────────────
export const checkAdFreeStatus = async (): Promise<boolean> => {
  const rc = getRC();
  if (!rc) return false;
  try {
    const info = await rc.getCustomerInfo();
    return !!info.entitlements.active[ENTITLEMENT_ID];
  } catch {
    return false;
  }
};

// ── Reklamsız satın al ────────────────────────────────────────────────────────
export const purchaseRemoveAds = async (): Promise<boolean> => {
  const rc = getRC();
  if (!rc) return false;
  try {
    const offerings = await rc.getOfferings();
    const pkg = offerings.current?.availablePackages?.[0];
    if (!pkg) throw new Error('Paket bulunamadı');
    const { customerInfo } = await rc.purchasePackage(pkg);
    return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
  } catch (e: any) {
    // Kullanıcı vazgeçtiyse hata fırlatma
    if (e?.userCancelled || e?.code === 'PURCHASE_CANCELLED_ERROR') return false;
    throw e;
  }
};

// ── Önceki satın alımları geri yükle ─────────────────────────────────────────
export const restorePurchases = async (): Promise<boolean> => {
  const rc = getRC();
  if (!rc) return false;
  try {
    const info = await rc.restorePurchases();
    return !!info.entitlements.active[ENTITLEMENT_ID];
  } catch {
    return false;
  }
};

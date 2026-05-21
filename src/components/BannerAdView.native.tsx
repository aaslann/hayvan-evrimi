/**
 * Native (iOS/Android) BannerAd bileşeni.
 * Metro bu dosyayı native platformlarda seçer; BannerAdView.tsx web için seçilir.
 */
import React from 'react';
import { Platform, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

const BANNER_ID = Platform.select({
  ios: 'ca-app-pub-3940256099942544/2934735716',     // TEST — üretimde değiştir
  android: 'ca-app-pub-3940256099942544/6300978111', // TEST — üretimde değiştir
}) ?? '';

interface Props {
  adFree?: boolean;
}

export const BannerAdView = ({ adFree }: Props) => {
  if (adFree) return null;

  return (
    <View style={{ alignItems: 'center', paddingVertical: 4 }}>
      <BannerAd
        unitId={BANNER_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
};

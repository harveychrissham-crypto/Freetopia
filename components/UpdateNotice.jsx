import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppIcon from './AppIcon';

const C = {
  panel: '#0E1824',
  line: '#203246',
  text: '#F4F7FA',
  muted: '#8A99AA',
  blue: '#4B78A8',
  blueSoft: '#173452',
  error: '#D98C98',
};

const version = Constants.expoConfig?.version || '0.2.1';
const storageKey = 'freetopia-update-seen-' + version;
const downloadedKey = 'freetopia-update-apk-' + version;
const updateUrl = 'https://github.com/harveychrissham-crypto/Freetopia/releases/latest/download/app-release.apk';

export default function UpdateNotice() {
  const [visible, setVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [apkUri, setApkUri] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      const [seen, savedApk] = await Promise.all([
        AsyncStorage.getItem(storageKey),
        AsyncStorage.getItem(downloadedKey),
      ]);

      if (!mounted) return;
      setVisible(!seen);
      if (savedApk) {
        const info = await FileSystem.getInfoAsync(savedApk);
        if (mounted && info.exists) {
          setApkUri(savedApk);
          setDownloaded(true);
        } else {
          await AsyncStorage.removeItem(downloadedKey);
        }
      }
    })().catch(() => {
      if (mounted) setVisible(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const dismiss = async () => {
    setVisible(false);
    await AsyncStorage.setItem(storageKey, '1');
  };

  const downloadUpdate = async () => {
    if (Platform.OS !== 'android' || downloading) return;

    setError('');
    setDownloading(true);
    setProgress(0);

    try {
      const fileUri = FileSystem.cacheDirectory + 'freetopia-update.apk';

      const task = FileSystem.createDownloadResumable(
        updateUrl,
        fileUri,
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          if (totalBytesExpectedToWrite > 0) {
            setProgress(totalBytesWritten / totalBytesExpectedToWrite);
          }
        }
      );

      const result = await task.downloadAsync();
      if (!result?.uri) throw new Error('The APK download did not complete.');

      setApkUri(result.uri);
      setDownloaded(true);
      setProgress(1);
      await AsyncStorage.setItem(downloadedKey, result.uri);
    } catch (e) {
      setError('Download failed. Check your connection and try again.');
      setDownloaded(false);
    } finally {
      setDownloading(false);
    }
  };

  const installUpdate = async () => {
    if (Platform.OS !== 'android' || !apkUri) return;

    setError('');

    try {
      const contentUri = await FileSystem.getContentUriAsync(apkUri);

      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        type: 'application/vnd.android.package-archive',
        flags: 1,
      });
    } catch (e) {
      setError('Android blocked the installer. Allow Freetopia to install unknown apps, then tap Install update again.');
      try {
        await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.MANAGE_UNKNOWN_APP_SOURCES, {
          data: 'package:com.freetopia.app',
        });
      } catch {
        // Some Android versions do not expose the per-app unknown-source settings screen.
      }
    }
  };

  if (!visible || Platform.OS !== 'android') return null;

  const progressPercent = Math.round(progress * 100);

  return (
    <View style={s.card}>
      <View style={s.iconWrap}>
        <AppIcon name="spark" size={18} color={C.text} />
      </View>

      <View style={s.body}>
        <Text style={s.title}>New Freetopia update</Text>
        <Text style={s.message}>
          A newer Android build is ready. Download it inside Freetopia, then install it directly on your device.
        </Text>

        {downloading && (
          <View style={s.progressArea}>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${Math.max(4, progressPercent)}%` }]} />
            </View>
            <Text style={s.progressText}>{progressPercent}% downloaded</Text>
          </View>
        )}

        {!!error && <Text style={s.error}>{error}</Text>}

        <View style={s.actions}>
          {!downloaded ? (
            <Pressable
              disabled={downloading}
              onPress={downloadUpdate}
              style={({ pressed }) => [s.primary, pressed && s.pressed, downloading && s.disabled]}
            >
              <Text style={s.primaryText}>{downloading ? 'Downloading…' : 'Download update'}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={installUpdate}
              style={({ pressed }) => [s.primary, pressed && s.pressed]}
            >
              <Text style={s.primaryText}>Install update</Text>
            </Pressable>
          )}

          {error && !downloading && (
            <Pressable onPress={downloadUpdate} style={({ pressed }) => [s.secondary, pressed && s.pressed]}>
              <Text style={s.secondaryText}>Retry</Text>
            </Pressable>
          )}

          <Pressable onPress={dismiss} style={({ pressed }) => [s.dismiss, pressed && s.pressed]}>
            <Text style={s.dismissText}>Later</Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={dismiss}
        accessibilityLabel="Dismiss update notification"
        style={({ pressed }) => [s.close, pressed && s.pressed]}
      >
        <AppIcon name="close" size={15} color={C.muted} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.panel,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  body: {
    flex: 1,
    paddingRight: 22,
  },
  title: {
    color: C.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 5,
  },
  message: {
    color: C.muted,
    fontSize: 12.5,
    lineHeight: 18,
  },
  progressArea: {
    marginTop: 10,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#172433',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: C.blue,
  },
  progressText: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
  },
  error: {
    color: C.error,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 11,
    gap: 8,
  },
  primary: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: C.blueSoft,
  },
  primaryText: {
    color: C.text,
    fontSize: 12,
    fontWeight: '800',
  },
  secondary: {
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.line,
  },
  secondaryText: {
    color: C.text,
    fontSize: 12,
    fontWeight: '700',
  },
  dismiss: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dismissText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  close: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.55,
  },
});

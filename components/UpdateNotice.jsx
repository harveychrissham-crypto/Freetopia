import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppIcon from './AppIcon';

const C = { panel:'#0E1824', line:'#203246', text:'#F4F7FA', muted:'#8A99AA', blue:'#4B78A8' };
const version = Constants.expoConfig?.version || '0.2.1';
const storageKey = 'freetopia-update-seen-' + version;

const updateUrl = 'https://github.com/harveychrissham-crypto/Freetopia/releases/latest/download/app-release.apk';

export default function UpdateNotice({ onPress }) {
  const [visible,setVisible] = useState(false);
  const [downloading,setDownloading] = useState(false);
  const [error,setError] = useState('');
  useEffect(() => {
    let mounted=true;
    AsyncStorage.getItem(storageKey).then(seen => { if(mounted && !seen) setVisible(true); });
    return () => { mounted=false; };
  },[]);
  const dismiss=async()=>{ setVisible(false); await AsyncStorage.setItem(storageKey,'1'); };
  const installUpdate=async()=>{
    if (onPress) { onPress(); return; }
    if (Platform.OS !== 'android') return;
    setDownloading(true);
    setError('');
    try {
      const fileUri = `${FileSystem.cacheDirectory}freetopia-latest.apk`;
      const result = await FileSystem.downloadAsync(updateUrl, fileUri);
      const contentUri = await FileSystem.getContentUriAsync(result.uri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        type: 'application/vnd.android.package-archive',
        flags: 1 | 268435456,
      });
    } catch (e) {
      setError('Could not start the installer. Please try again.');
    } finally {
      setDownloading(false);
    }
  };
  if(!visible) return null;
  return (
    <View style={s.card}>
      <View style={s.iconWrap}><AppIcon name="spark" size={18} color={C.text}/></View>
      <View style={s.body}>
        <Text style={s.title}>Freetopia has been updated</Text>
        <Text style={s.message}>You’re now using version {version}. A new Freetopia build is ready. Tap Download update to download and install the latest Android APK.</Text>
        <View style={s.actions}>
          <Pressable onPress={onPress || (() => Linking.openURL(updateUrl))} style={({pressed})=>[s.primary,pressed&&s.pressed]}><Text style={s.primaryText}>Download update</Text></Pressable>
          <Pressable onPress={dismiss} style={({pressed})=>[s.dismiss,pressed&&s.pressed]}><Text style={s.dismissText}>Dismiss</Text></Pressable>
        </View>
      </View>
      <Pressable onPress={dismiss} accessibilityLabel="Dismiss update notification" style={({pressed})=>[s.close,pressed&&s.pressed]}><AppIcon name="close" size={15} color={C.muted}/></Pressable>
    </View>
  );
}
const s=StyleSheet.create({
  card:{marginHorizontal:16,marginTop:12,marginBottom:4,padding:14,borderRadius:18,borderWidth:1,borderColor:C.line,backgroundColor:C.panel,flexDirection:'row',alignItems:'flex-start'},
  iconWrap:{width:36,height:36,borderRadius:12,backgroundColor:C.blue,alignItems:'center',justifyContent:'center',marginRight:11},
  body:{flex:1,paddingRight:22},title:{color:C.text,fontSize:14,fontWeight:'800',marginBottom:4},message:{color:C.muted,fontSize:12.5,lineHeight:18},
  actions:{flexDirection:'row',alignItems:'center',marginTop:10,gap:8},primary:{paddingHorizontal:11,paddingVertical:7,borderRadius:9,backgroundColor:'#173452'},primaryText:{color:C.text,fontSize:12,fontWeight:'800'},
  dismiss:{paddingHorizontal:8,paddingVertical:7},dismissText:{color:C.muted,fontSize:12,fontWeight:'700'},close:{position:'absolute',right:10,top:10,width:28,height:28,alignItems:'center',justifyContent:'center'},pressed:{opacity:0.7},disabled:{opacity:0.55},error:{color:'#D98C98',fontSize:12,marginTop:7}
});
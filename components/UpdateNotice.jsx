import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppIcon from './AppIcon';

const C = { panel:'#0E1824', line:'#203246', text:'#F4F7FA', muted:'#8A99AA', blue:'#4B78A8' };
const version = Constants.expoConfig?.version || '0.2.1';
const storageKey = 'freetopia-update-seen-' + version;
const updateUrl = 'https://github.com/harveychrissham-crypto/Freetopia/releases/latest/download/app-release.apk';

export default function UpdateNotice() {
  const [visible,setVisible] = useState(false);

  useEffect(() => {
    let mounted=true;
    AsyncStorage.getItem(storageKey).then(seen => {
      if(mounted && !seen) setVisible(true);
    }).catch(()=>{});
    return () => { mounted=false; };
  },[]);

  const dismiss=async()=>{
    setVisible(false);
    await AsyncStorage.setItem(storageKey,'1').catch(()=>{});
  };

  const installUpdate=async()=>{
    try { await Linking.openURL(updateUrl); } catch {}
  };

  if(!visible) return null;

  return (
    <View style={s.card}>
      <View style={s.iconWrap}><AppIcon name="spark" size={16} color={C.text}/></View>
      <View style={s.body}>
        <Text style={s.title} numberOfLines={1}>New Freetopia build available</Text>
        <Text style={s.message} numberOfLines={1}>Version {version} is installed. A newer Android build is ready.</Text>
      </View>
      <Pressable onPress={installUpdate} style={({pressed})=>[s.primary,pressed&&s.pressed]}>
        <Text style={s.primaryText}>Download</Text>
      </Pressable>
      <Pressable onPress={dismiss} accessibilityLabel="Dismiss update notification" style={({pressed})=>[s.close,pressed&&s.pressed]} hitSlop={6}>
        <AppIcon name="close" size={14} color={C.muted}/>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card:{marginHorizontal:16,marginTop:8,marginBottom:4,minHeight:54,paddingLeft:10,paddingRight:34,paddingVertical:7,borderRadius:13,borderWidth:1,borderColor:C.line,backgroundColor:C.panel,flexDirection:'row',alignItems:'center'},
  iconWrap:{width:28,height:28,borderRadius:9,backgroundColor:C.blue,alignItems:'center',justifyContent:'center',marginRight:9},
  body:{flex:1,minWidth:0,marginRight:8},
  title:{color:C.text,fontSize:12.5,fontWeight:'800',marginBottom:1},
  message:{color:C.muted,fontSize:10.5,lineHeight:14},
  primary:{paddingHorizontal:9,paddingVertical:6,borderRadius:8,backgroundColor:'#173452'},
  primaryText:{color:C.text,fontSize:10.5,fontWeight:'800'},
  close:{position:'absolute',right:6,top:6,width:22,height:22,alignItems:'center',justifyContent:'center'},
  pressed:{opacity:0.7},
});

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
      <View style={s.iconWrap}><AppIcon name="spark" size={18} color={C.text}/></View>
      <View style={s.body}>
        <Text style={s.title}>New Freetopia build available</Text>
        <Text style={s.message}>You’re on version {version}. Download the latest Android build when you’re ready.</Text>
        <View style={s.actions}>
          <Pressable onPress={installUpdate} style={({pressed})=>[s.primary,pressed&&s.pressed]}>
            <Text style={s.primaryText}>Download</Text>
          </Pressable>
          <Pressable onPress={dismiss} style={({pressed})=>[s.dismiss,pressed&&s.pressed]}>
            <Text style={s.dismissText}>Dismiss</Text>
          </Pressable>
        </View>
      </View>
      <Pressable onPress={dismiss} accessibilityLabel="Dismiss update notification" style={({pressed})=>[s.close,pressed&&s.pressed]}>
        <AppIcon name="close" size={15} color={C.muted}/>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card:{marginHorizontal:16,marginTop:10,marginBottom:4,minHeight:82,paddingHorizontal:12,paddingVertical:10,borderRadius:15,borderWidth:1,borderColor:C.line,backgroundColor:C.panel,flexDirection:'row',alignItems:'center'},
  iconWrap:{width:32,height:32,borderRadius:10,backgroundColor:C.blue,alignItems:'center',justifyContent:'center',marginRight:10},
  body:{flex:1,paddingRight:28,minWidth:0},
  title:{color:C.text,fontSize:14,fontWeight:'800',marginBottom:3},
  message:{color:C.muted,fontSize:11.5,lineHeight:16},
  actions:{flexDirection:'row',alignItems:'center',gap:5,marginTop:7},
  primary:{paddingHorizontal:10,paddingVertical:6,borderRadius:8,backgroundColor:'#173452'},
  primaryText:{color:C.text,fontSize:11.5,fontWeight:'800'},
  dismiss:{paddingHorizontal:7,paddingVertical:6},
  dismissText:{color:C.muted,fontSize:11.5,fontWeight:'700'},
  close:{position:'absolute',right:7,top:7,width:24,height:24,alignItems:'center',justifyContent:'center'},
  pressed:{opacity:0.7},
});

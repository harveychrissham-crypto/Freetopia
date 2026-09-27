import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../providers/AuthProvider';

const rows=[
 ['Account','Edit your profile details.','/edit-profile',true],
 ['Privacy','Visibility, interactions, blocking, and muted accounts.','',false],
 ['Notifications','Push, email, and activity preferences.','',false],
 ['Appearance','Theme, accessibility, and motion preferences.','',false],
 ['Security','Sessions and account security.','',false]
];

export default function Settings(){
 const r=useRouter(),{signOut}=useAuth();
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <Pressable onPress={()=>r.back()}><Text style={s.back}>‹ Back</Text></Pressable>
  <Text style={s.eyebrow}>CONTROL</Text><Text style={s.title}>Settings</Text>
  <Text style={s.lead}>Settings only expose controls that are connected to real Freetopia behavior.</Text>
  <View style={s.list}>{rows.map(([a,b,path,enabled],i)=><Pressable key={a} disabled={!enabled} onPress={()=>path&&r.push(path)} style={[s.row,i===rows.length-1&&s.last,!enabled&&s.disabled]}>
   <View style={s.icon}><Text style={!enabled&&s.dim}>✦</Text></View>
   <View style={{flex:1}}><Text style={[s.rowTitle,!enabled&&s.dim]}>{a}</Text><Text style={s.rowBody}>{b}</Text>{!enabled&&<Text style={s.soon}>Not connected yet</Text>}</View>
   <Text style={[s.chev,!enabled&&s.dim]}>{enabled?'›':'—'}</Text>
  </Pressable>)}</View>
  <Pressable onPress={signOut} style={s.signout}><Text style={s.signoutText}>Sign out</Text></Pressable>
 </ScrollView></SafeAreaView>
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#fff'},content:{padding:20},back:{fontSize:13,color:'#696974',marginBottom:28},
 eyebrow:{fontSize:10,fontWeight:'800',letterSpacing:1.5,color:'#6546f5'},title:{marginTop:8,fontSize:31,fontWeight:'760',letterSpacing:-1.1,color:'#17171b'},
 lead:{marginTop:8,fontSize:14,lineHeight:21,color:'#696974'},list:{marginTop:24,borderWidth:1,borderColor:'#e8e8ec',borderRadius:18,overflow:'hidden'},
 row:{minHeight:78,padding:14,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:1,borderBottomColor:'#e8e8ec'},
 last:{borderBottomWidth:0},disabled:{opacity:.62},icon:{width:36,height:36,borderRadius:12,backgroundColor:'#efedff',alignItems:'center',justifyContent:'center'},
 rowTitle:{fontSize:13,fontWeight:'700',color:'#17171b'},rowBody:{marginTop:3,fontSize:10,lineHeight:15,color:'#8a8a94'},soon:{marginTop:4,fontSize:9,fontWeight:'700',color:'#aaa'},
 chev:{fontSize:22,color:'#aaa'},dim:{color:'#aaa'},signout:{marginTop:18,height:48,borderRadius:12,borderWidth:1,borderColor:'#e8e8ec',alignItems:'center',justifyContent:'center'},
 signoutText:{fontSize:12,fontWeight:'800',color:'#9e2f2f'}
});
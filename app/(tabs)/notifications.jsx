import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

const c={ink:'#17171b',muted:'#696974',line:'#e8e8ec',surface:'#f7f7f9',accent:'#6546f5'};

export default function Notifications(){
 const r=useRouter(); const [items,setItems]=useState([]); const [loading,setLoading]=useState(true); const [refreshing,setRefreshing]=useState(false); const [error,setError]=useState('');
 const load=useCallback(async(pull=false)=>{
  if(pull)setRefreshing(true);else setLoading(true);
  setError('');
  const {data,error:queryError}=await supabase.from('notifications').select('id,type,post_id,comment_id,conversation_id,community_id,read_at,created_at,actor:actor_id(id,username,display_name)').order('created_at',{ascending:false}).limit(50);
  if(queryError){setError(queryError.message);setItems([]);}else setItems(data||[]);
  setLoading(false);setRefreshing(false);
 },[]);
 useFocusEffect(useCallback(()=>{load();},[load]));
 const markRead=async id=>{setItems(current=>current.map(item=>item.id===id?{...item,read_at:item.read_at||new Date().toISOString()}:item));await supabase.from('notifications').update({read_at:new Date().toISOString()}).eq('id',id);};
 const markAll=async()=>{const now=new Date().toISOString();setItems(current=>current.map(item=>({...item,read_at:item.read_at||now})));await supabase.from('notifications').update({read_at:now}).is('read_at',null);};
 const unread=items.filter(x=>!x.read_at).length;
 return <SafeAreaView style={s.safe}><ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)}/>} contentContainerStyle={s.content}>
  <View style={s.top}><View><Text style={s.eyebrow}>ACTIVITY</Text><Text style={s.title}>Notifications</Text></View>{unread>0&&<Pressable onPress={markAll} style={s.mark}><Text style={s.markText}>Mark all read</Text></Pressable>}</View>
  <Text style={s.lead}>Stay close to what’s happening around you.</Text>
  {!!error&&<View style={s.error}><Text style={s.errorText}>{error}</Text></View>}
  {loading&&<View style={s.empty}><Text style={s.h}>Loading activity…</Text></View>}
  {!loading&&!error&&items.length===0&&<View style={s.empty}><Text style={s.icon}>♡</Text><Text style={s.h}>You’re all caught up</Text><Text style={s.p}>New reactions, replies, and follows will appear here.</Text></View>}
  {!loading&&items.map(item=><NotificationRow key={item.id} item={item} onRead={markRead} onOpen={r}/>)}
 </ScrollView></SafeAreaView>
}

function NotificationRow({item,onRead,onOpen:r}){
 const actor=Array.isArray(item.actor)?item.actor[0]:item.actor; const name=actor?.display_name||actor?.username||'Someone';
 const map={reaction:'liked your post',comment:'replied to your post',follow:'started following you',follow_request:'sent you a follow request',mention:'mentioned you',message:'sent you a message',community:'updated a community',system:'sent you an update'}; const text=map[item.type]||'interacted with you';
 const open=()=>{onRead(item.id);if(item.post_id)r.push({pathname:'/post',params:{id:item.post_id}});};
 return <Pressable onPress={open} style={[s.row,!item.read_at&&s.unread]}><View style={s.avatar}><Text style={s.avatarText}>{name.charAt(0).toUpperCase()}</Text></View><View style={{flex:1}}><Text style={s.message}><Text style={s.name}>{name}</Text>{' '+text}</Text><Text style={s.time}>{new Date(item.created_at).toLocaleString()}</Text></View>{!item.read_at&&<View style={s.dot}/>}</Pressable>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#fff'},content:{padding:20,paddingBottom:30},top:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between'},eyebrow:{fontSize:10,fontWeight:'800',letterSpacing:1.5,color:c.accent},title:{marginTop:8,fontSize:31,fontWeight:'760',letterSpacing:-1.1,color:c.ink},lead:{marginTop:8,fontSize:14,lineHeight:21,color:c.muted},mark:{paddingHorizontal:10,paddingVertical:8,borderWidth:1,borderColor:c.line,borderRadius:10},markText:{fontSize:10,fontWeight:'700',color:c.ink},error:{marginTop:18,padding:13,borderRadius:13,backgroundColor:'#fff7f7'},errorText:{fontSize:12,color:'#9e2f2f'},empty:{marginTop:25,padding:24,borderWidth:1,borderColor:c.line,borderRadius:18,alignItems:'center',backgroundColor:c.surface},icon:{fontSize:28,color:c.accent},h:{marginTop:12,fontSize:17,fontWeight:'700',color:c.ink},p:{marginTop:7,textAlign:'center',fontSize:13,lineHeight:20,color:c.muted},row:{flexDirection:'row',alignItems:'center',gap:11,paddingVertical:15,borderBottomWidth:1,borderBottomColor:c.line},unread:{backgroundColor:'#faf9ff'},avatar:{width:42,height:42,borderRadius:21,backgroundColor:c.ink,alignItems:'center',justifyContent:'center'},avatarText:{color:'#fff',fontWeight:'750'},message:{fontSize:13,lineHeight:19,color:c.ink},name:{fontWeight:'750'},time:{marginTop:3,fontSize:10,color:'#9a9aa4'},dot:{width:7,height:7,borderRadius:4,backgroundColor:c.accent}});

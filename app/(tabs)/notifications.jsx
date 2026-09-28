import { useCallback, useEffect, useState } from 'react';
import { getImageUrl } from '../../lib/imageUrl';
import { useFocusEffect } from 'expo-router';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

const c={bg:'#060B12',ink:'#E9EEF4',muted:'#7F8D9D',line:'#182533',surface:'#0A121C',accent:'#4B78A8'};

export default function Notifications(){
 const r=useRouter(); const {user}=useAuth(); const [items,setItems]=useState([]); const [loading,setLoading]=useState(true); const [refreshing,setRefreshing]=useState(false); const [error,setError]=useState('');
 const load=useCallback(async(pull=false)=>{
  if(pull)setRefreshing(true);else setLoading(true);
  setError('');
  const {data,error:queryError}=await supabase.from('notifications').select('id,type,post_id,comment_id,conversation_id,community_id,read_at,created_at,actor:actor_id(id,username,display_name,avatar_url)').eq('recipient_id',user.id).order('created_at',{ascending:false}).limit(50);
  if(queryError){setError(queryError.message);setItems([]);}else setItems(data||[]);
  setLoading(false);setRefreshing(false);
 },[]);
 useFocusEffect(useCallback(()=>{load();},[load]));
 useEffect(()=>{
  if(!user?.id)return;
  const channel=supabase.channel('notifications-'+user.id)
   .on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:'recipient_id=eq.'+user.id},payload=>{
    setItems(current=>current.some(x=>x.id===payload.new?.id)?current:[payload.new,...current].slice(0,50));
   })
   .on('postgres_changes',{event:'UPDATE',schema:'public',table:'notifications',filter:'recipient_id=eq.'+user.id},payload=>{
    setItems(current=>current.map(x=>x.id===payload.new?.id?{...x,...payload.new}:x));
   })
   .subscribe();
  return()=>{supabase.removeChannel(channel);};
 },[user?.id]);
 const markRead=async id=>{
  const previous=items;
  const now=new Date().toISOString();
  setItems(current=>current.map(item=>item.id===id?{...item,read_at:item.read_at||now}:item));
  const {error:e}=await supabase.from('notifications').update({read_at:now}).eq('id',id);
  if(e){setItems(previous);setError(e.message);}
 };
 const markAll=async()=>{
  const previous=items;
  const now=new Date().toISOString();
  setItems(current=>current.map(item=>({...item,read_at:item.read_at||now})));
  const {error:e}=await supabase.from('notifications').update({read_at:now}).eq('recipient_id',user.id).is('read_at',null);
  if(e){setItems(previous);setError(e.message);}
 };
 const respond=async(item,accept)=>{
  const actor=Array.isArray(item.actor)?item.actor[0]:item.actor;
  if(!user?.id||!actor?.id)return;
  setError('');
  const query=accept
   ?supabase.from('follows').update({status:'accepted'}).eq('follower_id',actor.id).eq('following_id',user.id)
   :supabase.from('follows').delete().eq('follower_id',actor.id).eq('following_id',user.id);
  const {error:e}=await query;
  if(e){setError(e.message);return;}
  const now=new Date().toISOString();
  setItems(current=>current.map(x=>x.id===item.id?{...x,read_at:x.read_at||now,handled:accept?'accepted':'declined'}:x));
  await supabase.from('notifications').update({read_at:now}).eq('id',item.id);
 };
 const unread=items.filter(x=>!x.read_at).length;
 return <SafeAreaView style={s.safe}><ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)}/>} contentContainerStyle={s.content}>
  <View style={s.top}><View><Text style={s.eyebrow}>ACTIVITY</Text><View style={s.titleRow}><Text style={s.title}>Notifications</Text>{unread>0&&<View style={s.count}><Text style={s.countText}>{unread>99?'99+':unread}</Text></View>}</View></View>{unread>0&&<Pressable onPress={markAll} style={s.mark}><Text style={s.markText}>Mark all read</Text></Pressable>}</View>
  <Text style={s.lead}>Stay close to what’s happening around you.</Text>
  {!!error&&<View style={s.error}><Text style={s.errorText}>{error}</Text></View>}
  {loading&&<View style={s.empty}><Text style={s.h}>Loading activity…</Text></View>}
  {!loading&&!error&&items.length===0&&<View style={s.empty}><Text style={s.icon}>♡</Text><Text style={s.h}>You’re all caught up</Text><Text style={s.p}>New reactions, replies, and follows will appear here.</Text></View>}
  {!loading&&items.map(item=><NotificationRow key={item.id} item={item} onRead={markRead} onOpen={r} onRespond={respond}/>)}
 </ScrollView></SafeAreaView>
}

function NotificationRow({item,onRead,onOpen:r,onRespond}){
 const actor=Array.isArray(item.actor)?item.actor[0]:item.actor; const name=actor?.display_name||actor?.username||'Someone';
 const map={reaction:'reacted to your post',comment:'replied to your post',follow:'started following you',follow_request:'sent you a follow request',mention:'mentioned you',message:'sent you a message',community:'updated a community',system:'sent you an update'}; const text=map[item.type]||'interacted with you';
 const open=()=>{onRead(item.id);if(item.post_id)r.push({pathname:'/post',params:{id:item.post_id}});else if(item.conversation_id)r.push({pathname:'/conversation',params:{id:item.conversation_id}});else if(item.community_id)r.push({pathname:'/community',params:{id:item.community_id}});else if(actor?.id)r.push({pathname:'/profile',params:{id:actor.id}});};
 return <Pressable accessibilityRole="button" accessibilityLabel={`${name} ${text}`} onPress={open} style={[s.row,!item.read_at&&s.unread]}><View style={s.avatar}>{actor?.avatar_url?<Image source={{uri:getImageUrl(actor.avatar_url,{width:800,height:800,quality:100})}} style={s.avatarImage}/>:<Text style={s.avatarText}>{name.charAt(0).toUpperCase()}</Text>}</View><View style={{flex:1}}><Text style={s.message}><Text style={s.name}>{name}</Text>{' '+text}</Text><Text style={s.time}>{relativeTime(item.created_at)}</Text>{item.type==='follow_request'&&(item.handled?<Text style={s.time}>{item.handled==='accepted'?'Request accepted':'Request declined'}</Text>:<View style={{flexDirection:'row',gap:8,marginTop:8}}><Pressable accessibilityRole="button" onPress={()=>onRespond(item,true)} style={s.mark}><Text style={s.markText}>Accept</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>onRespond(item,false)} style={s.mark}><Text style={s.markText}>Decline</Text></Pressable></View>)}</View>{!item.read_at&&<View style={s.dot}/>}</Pressable>
}
function relativeTime(value){const ms=Date.now()-new Date(value).getTime();const minutes=Math.max(0,Math.floor(ms/60000));if(minutes<1)return'Just now';if(minutes<60)return minutes+'m ago';const hours=Math.floor(minutes/60);if(hours<24)return hours+'h ago';const days=Math.floor(hours/24);if(days<7)return days+'d ago';return new Date(value).toLocaleDateString(undefined,{month:'short',day:'numeric',year:days>365?'numeric':undefined});}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:c.bg},content:{padding:20,paddingBottom:30},top:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between'},eyebrow:{fontSize:10,fontWeight:'800',letterSpacing:1.5,color:c.accent},title:{marginTop:8,fontSize:31,fontWeight:'800',letterSpacing:-1.1,color:c.ink},titleRow:{flexDirection:'row',alignItems:'center',gap:8},count:{minWidth:22,height:22,paddingHorizontal:6,borderRadius:11,backgroundColor:'#243B57',alignItems:'center',justifyContent:'center'},countText:{color:'#BFD6EE',fontSize:9,fontWeight:'800'},lead:{marginTop:8,fontSize:14,lineHeight:21,color:c.muted},mark:{paddingHorizontal:10,paddingVertical:8,borderWidth:1,borderColor:c.line,borderRadius:10},markText:{fontSize:10,fontWeight:'700',color:c.ink},error:{marginTop:18,padding:13,borderRadius:13,backgroundColor:'#180F15'},errorText:{fontSize:12,color:'#C88491'},empty:{marginTop:25,padding:24,borderWidth:1,borderColor:c.line,borderRadius:18,alignItems:'center',backgroundColor:c.surface},icon:{fontSize:28,color:c.accent},h:{marginTop:12,fontSize:17,fontWeight:'700',color:c.ink},p:{marginTop:7,textAlign:'center',fontSize:13,lineHeight:20,color:c.muted},row:{flexDirection:'row',alignItems:'center',gap:11,paddingVertical:15,paddingHorizontal:8,borderBottomWidth:1,borderBottomColor:c.line,borderRadius:10},unread:{backgroundColor:'#0E1824',borderWidth:1,borderColor:'#172A3E'},avatar:{width:42,height:42,borderRadius:21,backgroundColor:'#253447',alignItems:'center',justifyContent:'center'},avatarText:{color:'#fff',fontWeight:'750'},avatarImage:{width:42,height:42,borderRadius:21},message:{fontSize:13,lineHeight:19,color:c.ink},name:{fontWeight:'750'},time:{marginTop:3,fontSize:10,color:'#66778A'},dot:{width:7,height:7,borderRadius:4,backgroundColor:'#4B78A8'}});

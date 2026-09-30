import { useCallback, useEffect, useRef, useState } from 'react';
import { getImageUrl } from '../../lib/imageUrl';
import { useFocusEffect } from 'expo-router';
import { Image, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { LoadingState, EmptyState } from '../../components/FeedbackState';
import AppIcon from '../../components/AppIcon';

const c={bg:'#060B12',ink:'#E9EEF4',muted:'#7F8D9D',line:'#172636',surface:'#09121C',accent:'#4B78A8'};

export default function Notifications(){
 const r=useRouter(); const {width}=useWindowDimensions(); const isDesktop=Platform.OS==='web'&&width>=1000; const {user}=useAuth(); const loadSequenceRef=useRef(0); const mountedRef=useRef(true); const [items,setItems]=useState([]); const [loading,setLoading]=useState(true); const [refreshing,setRefreshing]=useState(false); const [error,setError]=useState('');
 const load=useCallback(async(pull=false)=>{
  if(!user?.id)return;
  const sequence=++loadSequenceRef.current;
  if(pull)setRefreshing(true);else setLoading(true);
  setError('');
  const {data,error:queryError}=await supabase.from('notifications').select('id,type,post_id,comment_id,conversation_id,community_id,read_at,created_at,actor:actor_id(id,username,display_name,avatar_url),comment:comment_id(id,parent_id)').eq('recipient_id',user.id).order('created_at',{ascending:false}).limit(50);
  if(sequence!==loadSequenceRef.current||!mountedRef.current)return;
  if(queryError){setError(queryError.message);setItems([]);}else{
   let rows=data||[];
   const requesters=[...new Set(rows.filter(x=>x.type==='follow_request').map(x=>Array.isArray(x.actor)?x.actor[0]?.id:x.actor?.id).filter(Boolean))];
   if(requesters.length){
    const{data:follows,error:followError}=await supabase.from('follows').select('follower_id,status').eq('following_id',user.id).in('follower_id',requesters);
    if(sequence!==loadSequenceRef.current||!mountedRef.current)return;
    if(followError){setError(followError.message);}else{
     const statusById=new Map((follows||[]).map(x=>[x.follower_id,x.status]));
     rows=rows.map(x=>{
      if(x.type!=='follow_request')return x;
      const actor=Array.isArray(x.actor)?x.actor[0]:x.actor;
      const status=statusById.get(actor?.id);
      return {...x,requestStatus:status||null};
     });
    }
   }
   setItems(rows);
  }
  if(sequence===loadSequenceRef.current&&mountedRef.current){setLoading(false);setRefreshing(false);}
 },[user?.id]);
 useFocusEffect(useCallback(()=>{load();},[load]));
 useEffect(()=>()=>{mountedRef.current=false;loadSequenceRef.current+=1;},[]);
 useEffect(()=>{
  if(!user?.id)return;
  const channel=supabase.channel('notifications-'+user.id)
   .on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:'recipient_id=eq.'+user.id},async payload=>{
    const id=payload.new?.id;
    if(!id)return;
    let {data:item}=await supabase
     .from('notifications')
     .select('id,type,post_id,comment_id,conversation_id,community_id,read_at,created_at,actor:actor_id(id,username,display_name,avatar_url),comment:comment_id(id,parent_id)')
     .eq('id',id)
     .eq('recipient_id',user.id)
     .maybeSingle();
    if(!item||!mountedRef.current)return;
    if(item.type==='follow_request'){
     const actor=Array.isArray(item.actor)?item.actor[0]:item.actor;
     if(actor?.id){
      const{data:follow}=await supabase.from('follows').select('follower_id,status').eq('following_id',user.id).eq('follower_id',actor.id).maybeSingle();
      if(!mountedRef.current)return;
      item={...item,requestStatus:follow?.status||null};
     }
    }
    setItems(current=>current.some(x=>x.id===item.id)?current:[item,...current].slice(0,50));
   })
   .on('postgres_changes',{event:'UPDATE',schema:'public',table:'notifications',filter:'recipient_id=eq.'+user.id},payload=>{
    if(!mountedRef.current)return;
    setItems(current=>current.map(x=>x.id===payload.new?.id?{...x,...payload.new}:x));
   })
   .subscribe();
  return()=>{supabase.removeChannel(channel);};
 },[user?.id]);
 const markRead=async id=>{
  const now=new Date().toISOString();
  let previousReadAt=null;
  setItems(current=>current.map(item=>{
   if(item.id!==id)return item;
   previousReadAt=item.read_at;
   return item.read_at?item:{...item,read_at:now};
  }));
  const {error:e}=await supabase.from('notifications').update({read_at:now}).eq('id',id).eq('recipient_id',user.id);
  if(e){
   setItems(current=>current.map(item=>item.id===id?{...item,read_at:previousReadAt}:item));
   setError(e.message);
  }
 };
 const markAll=async()=>{
  const now=new Date().toISOString();
  setItems(current=>current.map(item=>({...item,read_at:item.read_at||now})));
  const {error:e}=await supabase.from('notifications').update({read_at:now}).eq('recipient_id',user.id).is('read_at',null);
  if(e){
   setItems(current=>current.map(item=>item.read_at===now?{...item,read_at:null}:item));
   setError(e.message);
  }
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
  setItems(current=>current.map(x=>x.id===item.id?{...x,read_at:x.read_at||now,requestStatus:accept?'accepted':'declined'}:x));
  await supabase.from('notifications').update({read_at:now}).eq('id',item.id).eq('recipient_id',user.id);
 };
 const grouped=groupNotifications(items); const unread=items.filter(x=>!x.read_at).length;
 return <SafeAreaView style={s.safe}>{!isDesktop&&<View style={s.mobileHeader}><Pressable accessibilityRole="button" accessibilityLabel="Go to Home" onPress={()=>r.replace('/(tabs)/home')} style={s.brandButton}><Image source={require('../../public/brand/freetopia-mark.png')} style={s.brandLogo}/><Text style={s.brand}>Freetopia</Text></Pressable><View style={s.headerActions}><Pressable accessibilityRole="button" accessibilityLabel="Search" onPress={()=>r.push('/(tabs)/explore')} style={s.headerButton}><AppIcon name="search" size={19} color="#C7D7E8"/></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Messages" onPress={()=>r.push('/(tabs)/messages')} style={s.headerButton}><AppIcon name="message" size={19} color="#C7D7E8"/></Pressable></View></View>}<ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)}/>} contentContainerStyle={s.content}>
  <View style={s.top}><View><Text style={s.eyebrow}>ACTIVITY</Text><View style={s.titleRow}><Text style={s.title}>Notifications</Text>{unread>0&&<View style={s.count}><Text style={s.countText}>{unread>99?'99+':unread}</Text></View>}</View></View>{unread>0&&<Pressable onPress={markAll} style={s.mark}><Text style={s.markText}>Mark all read</Text></Pressable>}</View>
  <Text style={s.lead}>Stay close to what’s happening around you.</Text>
  {!!error&&<View style={s.error}><Text style={s.errorText}>{error}</Text></View>}
  {loading&&<LoadingState label="Loading activity…" rows={4}/>}
  {!loading&&!error&&items.length===0&&<EmptyState icon="bell" title="You’re all caught up" body="New reactions, replies, and follows will appear here."/>}
  {!loading&&grouped.map(item=><NotificationRow key={item.id||item.items?.[0]?.id} item={item} onRead={markRead} onOpen={r} onRespond={respond}/>)}
 </ScrollView></SafeAreaView>
}

function NotificationRow({item,onRead,onOpen:r,onRespond}){ const grouped=item.grouped; const source=grouped?item.items[0]:item;
 const actor=Array.isArray(source.actor)?source.actor[0]:source.actor; const name=actor?.display_name||actor?.username||'Someone';
 const isCommentReaction=source.type==='reaction'&&!!source.comment_id; const isReply=source.type==='comment'&&!!source.comment?.parent_id; const map={reaction:isCommentReaction?'reacted to your comment':'reacted to your post',comment:isReply?'replied to your comment':'commented on your post',follow:'started following you',follow_request:'sent you a follow request',mention:'mentioned you',message:'sent you a message',community:'updated a community',system:'sent you an update'}; const text=grouped?(isCommentReaction?`${item.items.length} people reacted to your comment`:`${item.items.length} people reacted to your post`):(map[source.type]||'interacted with you');
 const open=()=>{if(grouped){item.items.forEach(x=>onRead(x.id));}else onRead(item.id);if(source.post_id)r.push({pathname:'/post',params:source.comment_id?{id:source.post_id,commentId:source.comment_id}:{id:source.post_id}});else if(source.conversation_id)r.push({pathname:'/conversation',params:{id:source.conversation_id}});else if(source.community_id)r.push({pathname:'/community',params:{id:source.community_id}});else if(actor?.id)r.push({pathname:'/profile',params:{id:actor.id}});};
 return <Pressable accessibilityRole="button" accessibilityLabel={`${name} ${text}`} onPress={open} style={[s.row,!item.read_at&&s.unread]}><View style={s.avatar}>{actor?.avatar_url?<Image source={{uri:getImageUrl(actor.avatar_url,{width:800,height:800,quality:100})}} style={s.avatarImage}/>:<AppIcon name={source.type==='follow'||source.type==='follow_request'?'profile':source.type==='message'?'message':source.type==='comment'?'comment':source.type==='reaction'?'heart':source.type==='mention'?'bell':'spark'} size={18} color="#BFD6EE"/>}</View><View style={{flex:1}}><Text style={s.message}><Text style={s.name}>{name}</Text>{' '+text}</Text><Text style={s.time}>{relativeTime(item.created_at)}</Text>{item.type==='follow_request'&&(item.requestStatus==='accepted'?<Text style={s.time}>Request accepted</Text>:item.requestStatus==='declined'?<Text style={s.time}>Request declined</Text>:<View style={{flexDirection:'row',gap:8,marginTop:8}}><Pressable accessibilityRole="button" onPress={event=>{event?.stopPropagation?.();onRespond(item,true)}} style={s.mark}><Text style={s.markText}>Accept</Text></Pressable><Pressable accessibilityRole="button" onPress={event=>{event?.stopPropagation?.();onRespond(item,false)}} style={s.mark}><Text style={s.markText}>Decline</Text></Pressable></View>)}</View>{!item.read_at&&<View style={s.dot}/>}</Pressable>
}
function relativeTime(value){const ms=Date.now()-new Date(value).getTime();const minutes=Math.max(0,Math.floor(ms/60000));if(minutes<1)return'Just now';if(minutes<60)return minutes+'m ago';const hours=Math.floor(minutes/60);if(hours<24)return hours+'h ago';const days=Math.floor(hours/24);if(days<7)return days+'d ago';return new Date(value).toLocaleDateString(undefined,{month:'short',day:'numeric',year:days>365?'numeric':undefined});}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:c.bg},mobileHeader:{height:58,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#111F2D',backgroundColor:c.bg},brandButton:{paddingVertical:7,paddingRight:10,flexDirection:'row',alignItems:'center',gap:8},brandLogo:{width:27,height:27},brand:{fontSize:20,fontWeight:'900',letterSpacing:-.5,color:c.ink},headerActions:{flexDirection:'row',alignItems:'center',gap:8},headerButton:{width:40,height:40,borderRadius:12,borderWidth:1,borderColor:'#1B2D3F',backgroundColor:'#0A141F',alignItems:'center',justifyContent:'center'},content:{paddingHorizontal:18,paddingTop:16,paddingBottom:104,maxWidth:760,width:'100%',alignSelf:'center'},top:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingBottom:2},eyebrow:{fontSize: 15,fontWeight:'800',letterSpacing:1.4,color:'#7893AD'},title:{marginTop:6,fontSize:26,fontWeight:'800',letterSpacing:-.8,color:c.ink},titleRow:{flexDirection:'row',alignItems:'center',gap:8},count:{minWidth:22,height:22,paddingHorizontal:6,borderRadius:8,backgroundColor:'#13253A',borderWidth:1,borderColor:'#203A55',alignItems:'center',justifyContent:'center'},countText:{color:'#BFD6EE',fontSize: 15,fontWeight:'800'},lead:{marginTop:5,fontSize: 14,lineHeight:18,color:c.muted,marginBottom:16},mark:{paddingHorizontal:10,paddingVertical:8,borderWidth:1,borderColor:'#1B3044',borderRadius:9,backgroundColor:'#0B1621'},markText:{fontSize: 14,fontWeight:'700',color:c.ink},error:{marginBottom:12,padding:12,borderRadius:10,backgroundColor:'#180F15',borderWidth:1,borderColor:'#3B202B'},errorText:{fontSize: 14,color:'#C88491'},empty:{marginTop:10,padding:30, borderWidth:1,borderColor:'#172636',borderRadius:14,alignItems:'center',backgroundColor:c.surface},icon:{fontSize:28,color:c.accent},h:{marginTop:12,fontSize:17,fontWeight:'700',color:c.ink},p:{marginTop:7,textAlign:'center',fontSize: 15,lineHeight:20,color:c.muted},row:{flexDirection:'row',alignItems:'center',gap:12,minHeight:68,paddingVertical:11,paddingHorizontal:10,borderBottomWidth:1,borderBottomColor:c.line,borderRadius:11},unread:{backgroundColor:'#0D1926',borderWidth:1,borderColor:'#19304A'},avatar:{width:43,height:43,borderRadius:22,backgroundColor:'#253447',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#30465D'},avatarText:{color:'#fff',fontWeight:'700'},avatarImage:{width:42,height:42,borderRadius:21},message:{fontSize: 14,lineHeight:19,color:'#DCE5EF'},name:{fontWeight:'700'},time:{marginTop:3,fontSize: 15,color:'#687A8D'},dot:{width:7,height:7,borderRadius:4,backgroundColor:'#4B78A8',marginLeft:3}});


function groupNotifications(items){
 const out=[]; const reactionGroups=new Map();
 for(const item of items){
  const canGroup=item.type==='reaction'&&!!item.post_id;
  if(!canGroup){out.push(item);continue;}
  const key=item.comment_id?'comment:'+item.comment_id:'post:'+item.post_id;
  const existing=reactionGroups.get(key);
  if(existing){
   existing.items.push(item);
   if(new Date(item.created_at)>new Date(existing.created_at))existing.created_at=item.created_at;
   if(!item.read_at)existing.read_at=null;
  }else{
   const group={...item,grouped:true,items:[item]};
   reactionGroups.set(key,group);out.push(group);
  }
 }
 return out.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
}

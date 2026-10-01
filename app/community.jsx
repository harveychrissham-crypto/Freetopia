import { useCallback,useEffect,useRef,useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Image, Pressable,RefreshControl,ScrollView,StyleSheet,Text,View } from 'react-native';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../lib/supabase';
import { getImageUrl } from '../lib/imageUrl';
import AppIcon from '../components/AppIcon';

const C={bg:'#060B12',panel:'#0A121C',line:'#182533',text:'#E9EEF4',muted:'#7F8D9D',accent:'#4B78A8',danger:'#A95B69'};

export default function Community(){
 const loadedRef=useRef(false); const mountedRef=useRef(true); const loadSeq=useRef(0); const params=useLocalSearchParams(),id=Array.isArray(params.id)?params.id[0]:params.id;const r=useRouter();const {user}=useAuth();const [community,setCommunity]=useState(null);const [member,setMember]=useState(null);const [members,setMembers]=useState(0);const [posts,setPosts]=useState([]);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 useEffect(()=>()=>{mountedRef.current=false;loadSeq.current+=1},[]);
 const load=useCallback(async(pull=false)=>{
  if(!id||!mountedRef.current)return;
  const seq=++loadSeq.current;
  setLoading(!pull&&!loadedRef.current);setError('');
  try{
  const [c,m,mc,p]=await Promise.all([
   supabase.from('communities').select('id,name,slug,description,is_private,creator_id').eq('id',id).single(),
   supabase.from('community_members').select('role,status').eq('community_id',id).eq('user_id',user?.id||'').maybeSingle(),
   supabase.from('community_members').select('*',{count:'exact',head:true}).eq('community_id',id).eq('status','active'),
   supabase.from('posts').select('id,content,created_at,author_id,profiles:author_id(id,display_name,username,avatar_url),post_media(id,storage_path,media_type,width,height,sort_order,thumbnail_path)').eq('community_id',id).order('created_at',{ascending:false}).limit(30)
  ]);
  if(seq!==loadSeq.current||!mountedRef.current)return;
  if(c.error)throw c.error;
  if(m.error)throw m.error;
  if(mc.error)throw mc.error;
  if(p.error)throw p.error;
  setCommunity(c.data);setMember(m.data);setMembers(mc.count||0);setPosts(p.data||[]);loadedRef.current=true;
  }catch(e){if(seq===loadSeq.current&&mountedRef.current)setError(e?.message||'Unable to load this community. Please try again.');}
  finally{if(seq===loadSeq.current&&mountedRef.current)setLoading(false)}
 },[id,user?.id]);
 useFocusEffect(useCallback(()=>{load();},[load]));
 if(loading)return <SafeAreaView style={s.safe}><View style={s.center}><Text style={s.loadingText}>Loading community…</Text></View></SafeAreaView>;
 if(!community)return <SafeAreaView style={s.safe}><View style={s.center}><Text style={s.emptyTitle}>Community not found</Text><Pressable onPress={()=>r.back()}><Text style={s.back}>← Go back</Text></Pressable></View></SafeAreaView>;

 const join=async()=>{
  if(!user||busy||!mountedRef.current)return;
  setBusy(true);setError('');
  try{
   const status=community.is_private?'pending':'active';
   const {error:e}=await supabase.from('community_members').upsert({community_id:id,user_id:user.id,status,role:'member'});
   if(e)throw e;
   if(!mountedRef.current)return;
   setMember({status,role:'member'});if(status==='active')setMembers(v=>v+1);
  }catch(e){if(mountedRef.current)setError(e?.message||'Unable to join this community. Please try again.');}
  finally{if(mountedRef.current)setBusy(false);}
 };
 const leave=async()=>{
  if(!user||busy||community.creator_id===user.id||!mountedRef.current)return;
  setBusy(true);setError('');
  try{
   const {error:e}=await supabase.from('community_members').delete().eq('community_id',id).eq('user_id',user.id);
   if(e)throw e;
   if(!mountedRef.current)return;
   setMember(null);setMembers(v=>Math.max(0,v-1));
  }catch(e){if(mountedRef.current)setError(e?.message||'Unable to leave this community. Please try again.');}
  finally{if(mountedRef.current)setBusy(false);}
 };
 const isActive=member?.status==='active';
 const visiblePosts=community.is_private&&!isActive?[]:posts;

 return <SafeAreaView style={s.safe}><ScrollView refreshControl={<RefreshControl refreshing={false} onRefresh={()=>load(true)}/>} contentContainerStyle={s.content}>
  <View style={s.topbar}><Pressable onPress={()=>r.back()}><AppIcon name="arrow-left" size={18} color={C.text}/></Pressable><Text style={s.topTitle}>Community</Text><Pressable onPress={()=>r.push('/communities')}><AppIcon name="close" size={17} color={C.muted}/></Pressable></View>
  <View style={s.hero}>
   <View style={s.badge}><Text style={s.badgeText}>{community.is_private?'PRIVATE':'COMMUNITY'}</Text></View>
   <Text style={s.title}>{community.name}</Text>
   {community.slug?<Text style={s.slug}>/{community.slug}</Text>:null}
   <Text style={s.meta}>{members} active member{members===1?'':'s'} · {visiblePosts.length} recent post{visiblePosts.length===1?'':'s'}</Text>
   <Text style={s.desc}>{community.description||'No description yet.'}</Text>
   {!member?<Pressable disabled={busy} onPress={join} style={[s.join,busy&&s.disabled]}><Text style={s.joinText}>{busy?'Joining…':community.is_private?'Request to join':'Join community'}</Text></Pressable>:member.status==='pending'?<View style={s.pending}><Text style={s.pendingText}>Request pending</Text><Text style={s.pendingHint}>You’ll be able to post here once your request is approved.</Text></View>:<View style={s.actions}><View><Text style={s.member}>You’re a member</Text><Text style={s.memberHint}>{community.is_private?'Private community member':'Active community member'}</Text></View>{community.creator_id!==user?.id?<Pressable disabled={busy} onPress={leave} style={s.leave}><Text style={s.leaveText}>{busy?'Leaving…':'Leave'}</Text></Pressable>:<Text style={s.owner}>Owner</Text>}</View>}
  </View>
  <View style={s.postCtaRow}><View><Text style={s.section}>Community posts</Text><Text style={s.sectionHint}>{isActive?'Share something with this community.':'Join the community to participate.'}</Text></View>{isActive&&<Pressable onPress={()=>r.push({pathname:'/create',params:{communityId:id}})} style={s.postCta}><View style={s.postCtaInner}><AppIcon name="plus" size={14} color={C.text}/><Text style={s.postCtaText}>Post</Text></View></Pressable>}</View>
  {visiblePosts.length===0?<View style={s.empty}><Text style={s.emptyTitle}>No posts yet</Text><Text style={s.p}>Posts shared with this community will appear here.</Text></View>:visiblePosts.map(p=><Pressable key={p.id} onPress={()=>r.push({pathname:'/post',params:{id:p.id}})} style={s.post}>
   <View style={s.postHead}>{p.profiles?.avatar_url?<Image source={{uri:getImageUrl(p.profiles.avatar_url,{width:800,height:800,quality:100})}} style={s.postAvatar}/>:<View style={s.postAvatarFallback}><Text style={s.postAvatarText}>{(p.profiles?.display_name||p.profiles?.username||'M').charAt(0).toUpperCase()}</Text></View>}<View style={{flex:1}}><Text style={s.author}>{p.profiles?.display_name||p.profiles?.username||'Member'}</Text>{p.profiles?.username?<Text style={s.handle}>@{p.profiles.username} · {relative(p.created_at)}</Text>:<Text style={s.handle}>{relative(p.created_at)}</Text>}</View></View>
   <Text style={s.text}>{p.content||''}</Text>{p.post_media?.length?<CommunityMedia media={p.post_media}/>:null}<Text style={s.time}>{new Date(p.created_at).toLocaleString()}</Text>
  </Pressable>)}
  {!!error&&<View style={s.error}><Text style={s.errorText}>{error}</Text></View>}
 </ScrollView></SafeAreaView>
}

function CommunityMedia({media}){const items=[...media].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));const image=items.find(x=>x.media_type==='image');return <View style={s.mediaWrap}>{image?<Image source={{uri:getImageUrl(image.thumbnail_path||image.storage_path,{width:1000,height:700,quality:90,resize:'contain'})}} style={s.mediaImage}/>:<View style={s.videoPlaceholder}><Text style={s.videoPlaceholderText}>Video attachment</Text></View>}{items.length>1?<View style={s.mediaCount}><Text style={s.mediaCountText}>{items.length} media items</Text></View>:null}</View>}
function relative(value){const m=Math.floor((Date.now()-new Date(value).getTime())/60000);if(m<1)return'now';if(m<60)return m+'m';const h=Math.floor(m/60);if(h<24)return h+'h';return Math.floor(h/24)+'d'}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},content:{paddingBottom:35},center:{flex:1,alignItems:'center',justifyContent:'center',gap:12},loadingText:{color:C.muted,fontSize:12},topbar:{height:58,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:C.line},back:{color:C.text,fontSize:25},topTitle:{color:C.text,fontSize:14,fontWeight:'800'},close:{color:C.muted,fontSize:27},
 hero:{margin:14,padding:18,borderWidth:1,borderColor:C.line,borderRadius:16,backgroundColor:C.panel},badge:{alignSelf:'flex-start',paddingHorizontal:9,paddingVertical:5,borderRadius:7,backgroundColor:'#111E2D',borderWidth:1,borderColor:'#263B56'},badgeText:{color:'#9DB5D1',fontSize:9,fontWeight:'800',letterSpacing:1},title:{color:C.text,fontSize:25,fontWeight:'800',marginTop:13},slug:{color:C.muted,fontSize:11,marginTop:3},meta:{color:'#A8B5C4',fontSize:10,marginTop:10},desc:{color:'#D2DAE4',fontSize:12,lineHeight:19,marginTop:12},join:{marginTop:16,height:40,paddingHorizontal:17,borderRadius:12,backgroundColor:C.accent,alignItems:'center',justifyContent:'center',alignSelf:'flex-start'},disabled:{opacity:.55},joinText:{color:'#F4F6F8',fontSize:11,fontWeight:'800'},pending:{marginTop:16,padding:11,borderRadius:11,borderWidth:1,borderColor:'#39465A',backgroundColor:'#0E1824'},pendingText:{color:C.text,fontSize:11,fontWeight:'800'},pendingHint:{color:C.muted,fontSize:10,marginTop:4},actions:{marginTop:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},member:{color:C.text,fontSize:11,fontWeight:'800'},memberHint:{color:C.muted,fontSize:10,marginTop:3},leave:{height:36,paddingHorizontal:14,borderRadius:10,borderWidth:1,borderColor:'#59303A',justifyContent:'center'},leaveText:{color:'#C9818D',fontSize:10,fontWeight:'800'},owner:{color:'#8FA6BE',fontSize:10,fontWeight:'800'},
 postCtaRow:{marginHorizontal:14,paddingHorizontal:2,paddingVertical:11,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},section:{color:C.text,fontSize:15,fontWeight:'800'},sectionHint:{color:C.muted,fontSize:10,marginTop:3},postCta:{height:36,paddingHorizontal:13,borderRadius:10,backgroundColor:'#243A52',justifyContent:'center'},postCtaText:{color:C.text,fontSize:10,fontWeight:'800'},postCtaInner:{flexDirection:'row',alignItems:'center',gap:6},
 post:{padding:15,marginHorizontal:14,marginBottom:8,borderWidth:1,borderColor:C.line,borderRadius:13,backgroundColor:C.panel},postHead:{flexDirection:'row',alignItems:'center',gap:10},postAvatar:{width:38,height:38,borderRadius:19},postAvatarFallback:{width:38,height:38,borderRadius:19,backgroundColor:'#26384D',alignItems:'center',justifyContent:'center'},postAvatarText:{color:C.text,fontWeight:'800'},author:{color:C.text,fontSize:11,fontWeight:'800'},handle:{color:C.muted,fontSize:9,marginTop:3},text:{color:'#DCE4ED',fontSize:12,lineHeight:19,marginTop:10},mediaWrap:{marginTop:10,height:220,borderRadius:11,overflow:'hidden',backgroundColor:'#08111B',position:'relative'},mediaImage:{width:'100%',height:'100%'},videoPlaceholder:{flex:1,alignItems:'center',justifyContent:'center'},videoPlaceholderText:{color:C.muted,fontSize:11,fontWeight:'700'},mediaCount:{position:'absolute',right:8,top:8,paddingHorizontal:8,paddingVertical:4,borderRadius:8,backgroundColor:'#08111B'},mediaCountText:{color:C.text,fontSize:9,fontWeight:'800'},time:{color:'#68798C',fontSize:9,marginTop:8},empty:{margin:14,padding:26,borderRadius:13,borderWidth:1,borderColor:C.line,backgroundColor:C.panel,alignItems:'center'},emptyTitle:{color:C.text,fontSize:14,fontWeight:'800'},p:{color:C.muted,fontSize:10,marginTop:6,textAlign:'center'},error:{margin:14,padding:12,borderRadius:11,borderWidth:1,borderColor:'#4B2630',backgroundColor:'#1B0D14'},errorText:{color:'#D18A96',fontSize:10}
});
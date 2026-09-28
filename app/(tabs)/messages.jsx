import { useCallback, useEffect, useMemo, useState } from 'react';
import { getImageUrl } from '../../lib/imageUrl';
import { Image, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import AppIcon from '../../components/AppIcon';

const C = { bg:'#060B12', panel:'#0A121C', panel2:'#0E1824', line:'#182533', text:'#E9EEF4', muted:'#7F8D9D', blue:'#4B78A8', violet:'#4A3F78', pink:'#7A496F', white:'#F4F6F8', danger:'#A95B69' };

export default function Messages() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 1000;
  const [tab,setTab] = useState('Messages');
  const [items,setItems] = useState([]);
  const [loading,setLoading] = useState(true);
  const [refreshing,setRefreshing] = useState(false);
  const [error,setError] = useState('');
  const [query,setQuery] = useState('');
  const [communities,setCommunities] = useState([]);

  const load = useCallback(async (pull=false) => {
    if (!user?.id) return;
    pull ? setRefreshing(true) : setLoading(true);
    setError('');
    const [{ data, error:e }, { data:communityData, error:communityError }] = await Promise.all([supabase
      .from('conversations')
      .select('id,kind,title,created_at,conversation_members(user_id,request_status,is_archived,is_muted,profiles:user_id(id,username,display_name,avatar_url))')
      .order('created_at',{ascending:false}), supabase.from('communities').select('id,name,slug,description,is_private,avatar_url').order('created_at',{ascending:false}).limit(20)]);
    setCommunities(communityData || []);
    if (e || communityError) { setError((e || communityError).message); setItems([]); }
    else {
      const base = (data||[]).map(c => {
        const members = c.conversation_members || [];
        return { ...c, me:members.find(m=>m.user_id===user.id), other:members.find(m=>m.user_id!==user.id) };
      }).filter(c=>c.me);
      const ids = base.map(c=>c.id);
      let latest = [];
      let readIds = new Set();
      if (ids.length) {
        const mr = await supabase.from('messages').select('id,conversation_id,sender_id,content,created_at').in('conversation_id',ids).order('created_at',{ascending:false}).limit(Math.min(ids.length*5,500));
        if (!mr.error) {
          latest = mr.data || [];
          const receivedIds = latest.filter(m=>m.sender_id!==user.id).map(m=>m.id);
          if(receivedIds.length){ const rr=await supabase.from('message_reads').select('message_id').eq('user_id',user.id).in('message_id',receivedIds); if(!rr.error) readIds=new Set((rr.data||[]).map(x=>x.message_id)); }
        }
      }
      const latestBy = {};
      const unreadBy = {};
      latest.forEach(m => {
        if (!latestBy[m.conversation_id]) latestBy[m.conversation_id]=m;
        if(m.sender_id!==user.id&&!readIds.has(m.id)) unreadBy[m.conversation_id]=(unreadBy[m.conversation_id]||0)+1;
      });
      const nextItems=base.map(c=>({...c,lastMessage:latestBy[c.id]||null,unreadCount:unreadBy[c.id]||0}));
      setItems(nextItems);
      setUnreadTotal(nextItems.reduce((sum,c)=>sum+(c.unreadCount||0),0));
    }
    setLoading(false); setRefreshing(false);
  },[user?.id]);

  useFocusEffect(useCallback(()=>{ load(); },[load]));

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel('messages-inbox-' + user.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => { load(); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => { load(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reads', filter: 'user_id=eq.' + user.id }, () => { load(); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversation_members', filter: 'user_id=eq.' + user.id }, () => { load(); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversation_members', filter: 'user_id=eq.' + user.id }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, load]);

  const change = async (c,patch) => {
    const { error:e } = await supabase.from('conversation_members').update(patch).eq('conversation_id',c.id).eq('user_id',user.id);
    if (e) setError(e.message); else load();
  };

  const rows = useMemo(() => {
    const filtered = items.filter(c => {
      const p=c.other?.profiles;
      const n=p?.display_name||p?.username||c.title||'Conversation';
      const term=query.trim().toLowerCase(); return !term || String(n).toLowerCase().includes(term);
    });
    return filtered.filter(c =>
      tab==='Requests' ? c.me.request_status==='pending' :
      tab==='Archived' ? c.me.request_status==='accepted' && c.me.is_archived :
      tab==='Messages' ? c.me.request_status==='accepted' && !c.me.is_archived : false
    );
  },[items,tab,query]);

  const requestCount = items.filter(c=>c.me?.request_status==='pending').length;
  const archiveCount = items.filter(c=>c.me?.request_status==='accepted' && c.me?.is_archived).length;

  if (desktop) return (
    <SafeAreaView style={s.safe}>
      <View style={s.desktopShell}>
        <Sidebar profile={profile} router={router} requestCount={requestCount} unreadTotal={unreadTotal} />
        <View style={s.desktopMain}>
          <Topbar query={query} setQuery={setQuery} router={router} profile={profile} unreadTotal={unreadTotal} />
          <View style={s.desktopBody}>
            <View style={s.inbox}>
              <View style={s.inboxHead}>
                <View><Text style={s.kicker}>CONNECT</Text><Text style={s.title}>Messages</Text></View>
                <Pressable onPress={()=>router.push('/new-message')} style={s.new}><AppIcon name="plus" size={14} color={C.white}/><Text style={s.newText}>New</Text></Pressable>
              </View>
              <Tabs tab={tab} setTab={setTab} requestCount={requestCount} />
              {error ? <Error text={error}/> : null}
              {loading ? <Loading/> : tab==='Communities' ? <CommunityList communities={communities} router={router} query={query}/> : rows.length ? rows.map(c=><Row key={c.id} c={c} tab={tab} open={()=>router.push({pathname:'/conversation',params:{id:c.id}})} accept={()=>change(c,{request_status:'accepted'})} decline={()=>change(c,{request_status:'declined'})} archive={()=>change(c,{is_archived:!c.me.is_archived})}/>) : <Empty tab={tab}/>}
            </View>
            <ConversationPreview />
            <QuickRail requestCount={requestCount} archiveCount={archiveCount} router={router} onArchive={()=>setTab('Archived')} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.mobileHead}>
        <View style={s.brand}><Image source={require('../../public/brand/freetopia-mark.png')} style={s.logo}/><Text style={s.brandText}>Freetopia</Text></View>
        <View style={s.headActions}><Pressable onPress={()=>router.push('/explore')}><AppIcon name="search" size={18} color={C.text}/></Pressable><Pressable onPress={()=>router.push('/new-message')}><AppIcon name="plus" size={18} color={C.text}/></Pressable></View>
      </View>
      <View style={s.mobileTitleRow}><Text style={s.mobileTitle}>Messages</Text><Pressable onPress={()=>router.push('/new-message')}><AppIcon name="write" size={20} color={C.text}/></Pressable></View>
      <Tabs tab={tab} setTab={setTab} requestCount={requestCount}/>
      {tab==='Communities' ? <CommunityList communities={communities} router={router}/> :
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} />} contentContainerStyle={s.mobileList}>
          {error ? <Error text={error}/> : null}
          {loading ? <Loading/> : rows.length ? rows.map(c=><Row key={c.id} c={c} tab={tab} open={()=>router.push({pathname:'/conversation',params:{id:c.id}})} accept={()=>change(c,{request_status:'accepted'})} decline={()=>change(c,{request_status:'declined'})} archive={()=>change(c,{is_archived:!c.me.is_archived})}/>) : <Empty tab={tab}/>}
        </ScrollView>
      }
    </SafeAreaView>
  );
}

function Sidebar({profile,router,requestCount,unreadTotal}) {
  const items=[['home','Home','/home'],['compass','Explore','/explore'],['users','Communities','/communities'],['message','Messages','/messages'],['bell','Notifications','/notifications'],['plus','Create','/create'],['profile','Profile','/profile']];
  return <View style={s.sidebar}>
    <View style={s.brand}><Image source={require('../../public/brand/freetopia-mark.png')} style={s.logo}/><Text style={s.brandText}>Freetopia</Text></View>
    <View style={s.sideNav}>{items.map(([ic,label,path])=><Pressable key={label} onPress={()=>router.push(path)} style={[s.sideItem,label==='Messages'&&s.active]}><AppIcon name={ic} size={18} color="#AFC0D3"/><Text style={s.sideLabel}>{label}</Text>{label==='Messages'&&unreadTotal>0?<Badge n={unreadTotal}/>:label==='Messages'&&requestCount>0?<Badge n={requestCount}/>:null}</Pressable>)}</View>
    <View style={s.proCard}><View style={{flexDirection:'row',alignItems:'center',gap:7}}><AppIcon name="spark" size={14} color={C.text}/><Text style={s.proTitle}>Freetopia Pro</Text></View><Text style={s.proBody}>Unlock more features, customize your experience, and get closer to your community.</Text><View style={s.proButton}><Text style={s.proButtonText}>Coming soon</Text></View></View>
  </View>;
}
function Topbar({query,setQuery,router,profile,unreadTotal}) {
  return <View style={s.topbar}><TextInput value={query} onChangeText={setQuery} placeholder="Search Freetopia..." placeholderTextColor="#667991" style={s.search}/><View style={s.topIcons}><Pressable accessibilityLabel="Notifications" onPress={()=>router.push('/notifications')} style={s.topIconButton}><AppIcon name="bell" size={18} color={C.text}/></Pressable><Pressable accessibilityLabel="Messages" onPress={()=>router.push('/messages')} style={s.topIconButton}><AppIcon name="message" size={18} color={C.text}/>{unreadTotal>0?<View style={s.topUnreadDot}><Text style={s.topUnreadText}>{unreadTotal>99?'99+':unreadTotal}</Text></View>:null}</Pressable><Pressable onPress={()=>router.push('/profile')}>{profile?.avatar_url?<Image source={{uri:getImageUrl(profile.avatar_url,{width:800,height:800,quality:100})}} style={s.topAvatar}/>:<View style={s.topAvatar}><Text style={s.topAvatarText}>{(profile?.display_name||profile?.username||'F')[0].toUpperCase()}</Text></View>}</Pressable></View></View>;
}
function Tabs({tab,setTab,requestCount}) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>{['Messages','Requests','Communities','Archived'].map(x=><Pressable key={x} onPress={()=>setTab(x)} style={[s.tab,tab===x&&s.tabSelected]}><Text style={[s.tabText,tab===x&&s.tabSelectedText]}>{x}</Text>{x==='Requests'&&requestCount>0?<View style={s.count}><Text style={s.countText}>{requestCount}</Text></View>:null}</Pressable>)}</ScrollView>;
}
function Row({c,tab,open,accept,decline,archive}) {
  const p=c.other?.profiles;
  const n=p?.display_name||p?.username||c.title||'Conversation';
  const preview=c.lastMessage?.content || (tab==='Requests'?'Can we connect?':'Start a conversation');
  const mine=c.lastMessage?.sender_id===c.me?.user_id;
  return <View style={s.row}>
    <Pressable onPress={open} style={s.rowMain}>
      {p?.avatar_url?<Image source={{uri:getImageUrl(p.avatar_url,{width:800,height:800,quality:100})}} style={s.avatar}/>:<View style={s.avatar}><Text style={s.avatarText}>{n[0]?.toUpperCase()}</Text></View>}
      <View style={s.rowInfo}><View style={s.rowTop}><Text style={s.name} numberOfLines={1}>{n}</Text>{c.lastMessage?<Text style={s.time}>{relative(c.lastMessage.created_at)}</Text>:null}</View><Text style={s.preview} numberOfLines={1}>{mine?'You: ':''}{preview}</Text></View>
    </Pressable>
    {c.unreadCount>0 && tab==='Messages' ? <View style={s.unreadBadge}><Text style={s.unreadBadgeText}>{c.unreadCount>99?'99+':c.unreadCount}</Text></View> : null}
    {tab==='Requests' ? <View style={s.requestActions}><Pressable onPress={accept} style={s.accept}><Text style={s.acceptText}>Accept</Text></Pressable><Pressable onPress={decline} style={s.decline}><Text style={s.declineText}>Decline</Text></Pressable></View> : <Pressable onPress={archive} style={s.archive}><Text style={s.archiveText}>{tab==='Archived'?'Unarchive':'Archive'}</Text></Pressable>}
  </View>;
}
function ConversationPreview(){return <View style={s.previewPanel}><Text style={s.previewHint}>Select a conversation</Text><Text style={s.previewTitle}>Your conversations live here</Text><Text style={s.previewBody}>Open a message to continue the conversation.</Text></View>}
function QuickRail({requestCount,archiveCount,router,onArchive}){return <View style={s.quickRail}><View style={s.quickCard}><Text style={s.quickTitle}>Quick Access</Text><View style={s.quickGrid}><Quick icon="users" label="My Communities" onPress={()=>router.push('/communities')}/><Quick icon="bookmark" label="Saved"/><Quick icon="archive" label="Archive" value={archiveCount} onPress={onArchive}/><Quick icon="spark" label="Achievements"/></View></View><View style={s.quickCard}><Text style={s.quickTitle}>Inbox</Text><QuickLine label="Hidden Requests" value={requestCount}/><QuickLine label="Archived chats" value={archiveCount}/><Pressable onPress={()=>router.push('/new-message')} style={s.railNew}><Text style={s.railNewText}>Start a new conversation</Text><AppIcon name="arrow-right" size={12} color={C.white}/></Pressable></View><View style={s.railPromo}><Image source={require('../../public/brand/freetopia-mark.png')} style={s.promoLogo}/><Text style={s.promoTitle}>Freetopia</Text><Text style={s.promoBody}>One conversation at a time.</Text></View></View>}
function Quick({icon,label,value,onPress}){return <Pressable onPress={onPress} disabled={!onPress} style={s.quick}><AppIcon name={icon} size={17} color="#9FB8D5"/><Text style={s.quickLabel}>{label}</Text>{value>0?<Text style={s.quickValue}>{value}</Text>:null}</Pressable>}
function QuickLine({label,value}){return <View style={s.quickLine}><Text style={s.quickLineLabel}>{label}</Text><Text style={s.quickLineValue}>{value}</Text></View>}
function CommunityList({communities,router,query=''}) {
  const visible=(communities||[]).filter(c=>!query.trim()||`${c.name||''} ${c.description||''}`.toLowerCase().includes(query.trim().toLowerCase()));
  if (!visible.length) return <View style={s.communityBox}><AppIcon name="users" size={26} color={C.violet}/><Text style={s.emptyTitle}>{query.trim()?'No matching communities':'No communities yet'}</Text><Text style={s.emptyBody}>{query.trim()?'Try a different search.':'Real communities will appear here as they are created.'}</Text></View>;
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.communityList}>
    <Pressable onPress={()=>router.push('/create-community')} style={s.createCommunity}><AppIcon name="plus" size={14} color={C.text}/><Text style={s.createCommunityText}>Create Community</Text></Pressable>
    {visible.map(c=><Pressable key={c.id} onPress={()=>router.push({pathname:'/community',params:{id:c.id}})} style={s.communityRow}>
      {c.avatar_url?<Image source={{uri:getImageUrl(c.avatar_url,{width:800,height:800,quality:100})}} style={s.communityAvatar}/>:<View style={s.communityAvatar}><Text style={s.communityAvatarText}>{c.name?.[0]?.toUpperCase()}</Text></View>}
      <View style={{flex:1}}><Text style={s.communityName}>{c.name}</Text><Text style={s.communityMembers}>{c.is_private?'Private community':'Public community'}</Text></View>
      <Text style={s.joined}>View</Text>
    </Pressable>)}
  </ScrollView>;
}
function Empty({tab}){return <View style={s.empty}><AppIcon name={tab==='Archived'?'archive':'message'} size={26} color={C.blue}/><Text style={s.emptyTitle}>{tab==='Requests'?'No message requests.':tab==='Archived'?'No archived conversations.':'No conversations yet.'}</Text><Text style={s.emptyBody}>{tab==='Requests'?'New requests from people you do not follow will appear here.':'Start a real conversation from someone’s profile or the New button.'}</Text></View>}
function Error({text}){return <View style={s.error}><Text style={s.errorTitle}>Couldn't load messages</Text><Text style={s.errorText}>{text}</Text></View>}
function Loading(){return <View style={s.loading}><Text style={s.muted}>Loading conversations…</Text></View>}
function Badge({n}){return <View style={s.badge}><Text style={s.badgeText}>{n>99?'99+':n}</Text></View>}
function relative(v){const m=Math.max(0,Math.floor((Date.now()-new Date(v).getTime())/60000));if(m<1)return 'now';if(m<60)return m+'m';const h=Math.floor(m/60);if(h<24)return h+'h';return Math.floor(h/24)+'d'}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},desktopShell:{flex:1,flexDirection:'row',backgroundColor:C.bg},sidebar:{width:225,padding:18,paddingTop:26,borderRightWidth:1,borderRightColor:C.line,backgroundColor:'#060D16'},brand:{flexDirection:'row',alignItems:'center',gap:9},logo:{width:34,height:34},brandText:{color:C.text,fontSize:18,fontWeight:'800'},sideNav:{marginTop:35,gap:5},sideItem:{minHeight:46,paddingHorizontal:12,borderRadius:10,flexDirection:'row',alignItems:'center',gap:13},active:{backgroundColor:'#182536'},sideIcon:{width:22,color:'#AFC0D3',fontSize:19,textAlign:'center'},sideLabel:{color:'#C9D4E2',fontSize:13,fontWeight:'600',flex:1},badge:{minWidth:20,height:20,borderRadius:10,backgroundColor:C.violet,alignItems:'center',justifyContent:'center'},badgeText:{color:C.white,fontSize:9,fontWeight:'800'},proCard:{marginTop:'auto',borderWidth:1,borderColor:'#273546',borderRadius:12,padding:13,backgroundColor:'#111B28'},proTitle:{color:C.text,fontSize:11,fontWeight:'800'},proBody:{color:'#BDB6E6',fontSize:9,lineHeight:14,marginTop:6},proButton:{height:30,borderRadius:15,backgroundColor:C.blue,alignItems:'center',justifyContent:'center',marginTop:10},proButtonText:{color:C.white,fontSize:9,fontWeight:'800'},
 desktopMain:{flex:1},topbar:{height:64,borderBottomWidth:1,borderBottomColor:C.line,flexDirection:'row',alignItems:'center',paddingHorizontal:24,gap:20},search:{height:36,backgroundColor:'#101D30',borderRadius:9,paddingHorizontal:14,color:C.text,fontSize:11,flex:1,maxWidth:510,borderWidth:1,borderColor:'#172D46'},topIcons:{marginLeft:'auto',flexDirection:'row',alignItems:'center',gap:20},topIconButton:{width:30,height:30,alignItems:'center',justifyContent:'center'},topIcon:{color:C.text,fontSize:20},topUnreadDot:{position:'absolute',right:-7,top:-5,minWidth:15,height:15,paddingHorizontal:3,borderRadius:8,backgroundColor:C.violet,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:C.bg},topUnreadText:{color:C.white,fontSize:7,fontWeight:'800'},topAvatar:{width:31,height:31,borderRadius:16,backgroundColor:'#324761',alignItems:'center',justifyContent:'center'},topAvatarText:{color:C.text,fontSize:12,fontWeight:'800'},desktopBody:{flex:1,flexDirection:'row',padding:12,gap:12},inbox:{width:315,borderWidth:1,borderColor:C.line,borderRadius:12,overflow:'hidden',backgroundColor:C.panel},inboxHead:{padding:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},kicker:{color:C.blue,fontSize:9,fontWeight:'800',letterSpacing:1.4},title:{color:C.text,fontSize:21,fontWeight:'800',marginTop:3},new:{height:32,paddingHorizontal:11,borderRadius:9,backgroundColor:C.violet,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},newText:{color:C.white,fontSize:10,fontWeight:'800'},tabs:{gap:5,paddingHorizontal:10,paddingBottom:10},tab:{height:31,paddingHorizontal:10,borderRadius:15,flexDirection:'row',alignItems:'center',gap:5},tabSelected:{backgroundColor:'#182536'},tabText:{color:C.muted,fontSize:9,fontWeight:'700'},tabSelectedText:{color:C.text},count:{minWidth:16,height:16,borderRadius:8,backgroundColor:C.violet,alignItems:'center',justifyContent:'center'},countText:{color:C.white,fontSize:8,fontWeight:'800'},row:{minHeight:66,paddingHorizontal:10,paddingVertical:9,borderTopWidth:1,borderTopColor:C.line,flexDirection:'row',alignItems:'center',gap:7},rowMain:{flex:1,flexDirection:'row',alignItems:'center',gap:9},avatar:{width:40,height:40,borderRadius:20,backgroundColor:'#243B55',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#385270'},avatarText:{color:C.text,fontSize:14,fontWeight:'800'},rowInfo:{flex:1,minWidth:0},rowTop:{flexDirection:'row',alignItems:'center',gap:6},name:{color:C.text,fontSize:11,fontWeight:'800',flex:1},time:{color:C.muted,fontSize:8},preview:{color:'#8FA0B4',fontSize:9,marginTop:4},unreadBadge:{minWidth:20,height:20,paddingHorizontal:5,borderRadius:10,backgroundColor:C.blue,alignItems:'center',justifyContent:'center',marginRight:2},unreadBadgeText:{color:C.white,fontSize:8,fontWeight:'800'},requestActions:{position:'absolute',right:9,bottom:7,flexDirection:'row',gap:4},accept:{paddingHorizontal:8,height:24,borderRadius:12,backgroundColor:C.blue,alignItems:'center',justifyContent:'center'},acceptText:{color:C.white,fontSize:8,fontWeight:'800'},decline:{paddingHorizontal:7,height:24,borderRadius:12,borderWidth:1,borderColor:'#344B64',alignItems:'center',justifyContent:'center'},declineText:{color:'#B8C5D3',fontSize:8,fontWeight:'700'},archive:{paddingHorizontal:7,height:25,borderRadius:12,borderWidth:1,borderColor:'#263B52',justifyContent:'center'},archiveText:{color:'#91A3B8',fontSize:7,fontWeight:'700'},previewPanel:{flex:1,borderWidth:1,borderColor:C.line,borderRadius:12,backgroundColor:'#050B13',alignItems:'center',justifyContent:'center'},previewHint:{color:C.blue,fontSize:9,fontWeight:'800',letterSpacing:1},previewTitle:{color:C.text,fontSize:20,fontWeight:'800',marginTop:8},previewBody:{color:C.muted,fontSize:11,marginTop:5},quickRail:{width:245,gap:12},quickCard:{borderWidth:1,borderColor:C.line,borderRadius:12,backgroundColor:C.panel,padding:13},quickTitle:{color:C.text,fontSize:12,fontWeight:'800',marginBottom:10},quickGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},quick:{width:'47%',minHeight:58,borderRadius:9,backgroundColor:'#0D1A2A',borderWidth:1,borderColor:'#182C43',padding:8},quickIcon:{color:'#9FB8D5',fontSize:17},quickLabel:{color:'#B7C4D3',fontSize:8,marginTop:5},quickValue:{color:C.text,fontSize:8,fontWeight:'800',marginTop:2},quickLine:{height:34,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:C.line},quickLineLabel:{color:'#AAB8C8',fontSize:9},quickLineValue:{color:C.text,fontSize:9,fontWeight:'800'},railNew:{marginTop:12,height:34,borderRadius:17,backgroundColor:C.blue,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},railNewText:{color:C.white,fontSize:8,fontWeight:'800'},railPromo:{borderWidth:1,borderColor:'#273546',borderRadius:12,padding:13,backgroundColor:'#111B28'},promoLogo:{width:32,height:32},promoTitle:{color:C.text,fontSize:12,fontWeight:'800',marginTop:7},promoBody:{color:'#BEB7E7',fontSize:9,marginTop:3},
 mobileHead:{height:52,paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:C.line},headActions:{flexDirection:'row',gap:18,alignItems:'center'},icon:{color:C.text,fontSize:21},mobileTitleRow:{paddingHorizontal:16,paddingTop:12,paddingBottom:4,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},mobileTitle:{color:C.text,fontSize:23,fontWeight:'800'},compose:{color:C.text,fontSize:22},mobileList:{paddingBottom:80},empty:{margin:14,padding:28,borderWidth:1,borderColor:C.line,borderRadius:14,backgroundColor:C.panel,alignItems:'center'},emptyIcon:{color:C.blue,fontSize:25},emptyTitle:{color:C.text,fontSize:14,fontWeight:'800',marginTop:10,textAlign:'center'},emptyBody:{color:C.muted,fontSize:10,lineHeight:16,textAlign:'center',marginTop:6,maxWidth:290},communityList:{padding:14,paddingBottom:90},createCommunity:{height:42,borderRadius:10,backgroundColor:'#101F32',borderWidth:1,borderColor:'#1B334D',alignItems:'center',justifyContent:'center',marginBottom:8},createCommunityText:{color:C.text,fontSize:10,fontWeight:'800'},communityRow:{minHeight:64,flexDirection:'row',alignItems:'center',gap:10,borderBottomWidth:1,borderBottomColor:C.line,paddingVertical:9},communityAvatar:{width:42,height:42,borderRadius:11,backgroundColor:'#202B3A',alignItems:'center',justifyContent:'center'},communityAvatarText:{color:C.text,fontSize:15,fontWeight:'800'},communityName:{color:C.text,fontSize:11,fontWeight:'800'},communityMembers:{color:C.muted,fontSize:9,marginTop:4},joined:{paddingHorizontal:9,paddingVertical:6,borderRadius:12,borderWidth:1,borderColor:'#263B52',color:'#B8C8DA',fontSize:8,fontWeight:'800'},communityBox:{margin:14,padding:30,borderWidth:1,borderColor:C.line,borderRadius:14,backgroundColor:C.panel,alignItems:'center'},communityIcon:{fontSize:28,color:C.violet},error:{margin:10,padding:11,borderWidth:1,borderColor:'#522632',borderRadius:9,backgroundColor:'#1B0D14'},errorTitle:{color:'#FF9BAD',fontSize:10,fontWeight:'800'},errorText:{color:'#C88B96',fontSize:9,marginTop:3},loading:{padding:25,alignItems:'center'},muted:{color:C.muted,fontSize:10}
});

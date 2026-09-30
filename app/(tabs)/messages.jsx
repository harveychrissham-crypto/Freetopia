import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getImageUrl } from '../../lib/imageUrl';
import { Image, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import AppIcon from '../../components/AppIcon';
import { LoadingState, EmptyState } from '../../components/FeedbackState';

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
  const [unreadTotal,setUnreadTotal] = useState(0);
  const loadSequence = useRef(0);
  const reloadTimer = useRef(null);
  const loadInFlight = useRef(false);
  const reloadPending = useRef(false);
  const mountedRef = useRef(true);
  const itemsLengthRef = useRef(0);
  itemsLengthRef.current = items.length;

  const load = useCallback(async (pull=false) => {
    if (!user?.id || !mountedRef.current) return;
    if(loadInFlight.current&&!pull)return;
    const sequence=++loadSequence.current;
    loadInFlight.current=true;
    pull ? setRefreshing(true) : setLoading(!itemsLengthRef.current);
    setError('');
    try {
      // Fetch the lightweight conversation list and inbox summary together so the
      // Messages screen never waits on one network round-trip before starting the next.
      // Requests are fetched separately from the normal inbox. A pending member
      // has no readable messages yet, so relying on the message inbox can hide a
      // perfectly valid request. The explicit membership query makes Requests
      // independent from get_message_inbox.
      const conversationSelect='id,kind,title,created_at,conversation_members(user_id,request_status,is_archived,is_muted,profiles:user_id(id,username,display_name,avatar_url))';
      const requestsPromise=tab==='Requests'
        ? supabase.from('conversation_members')
            .select('conversation_id,user_id,request_status,is_archived,is_muted,conversations:conversation_id(id,kind,title,created_at,conversation_members(user_id,request_status,is_archived,is_muted,profiles:user_id(id,username,display_name,avatar_url)))')
            .eq('user_id',user.id)
            .eq('request_status','pending')
        : Promise.resolve({data:[],error:null});
      const [conversationResult,inboxResult,requestsResult]=await Promise.all([
        supabase.from('conversations').select(conversationSelect).order('created_at',{ascending:false}),
        tab==='Communities'||tab==='Requests'?Promise.resolve({data:null,error:null}):supabase.rpc('get_message_inbox'),
        requestsPromise
      ]);
      if(sequence!==loadSequence.current||!mountedRef.current)return;
      const {data,error:e}=conversationResult;
      if(e){setError(e.message);setItems([]);}
      else if(tab==='Communities'){
        const {data:communityData,error:communityError}=await supabase.from('communities').select('id,name,slug,description,is_private,avatar_url').order('created_at',{ascending:false}).limit(20);
        if(sequence!==loadSequence.current||!mountedRef.current)return;
        if(communityError)setError(communityError.message);
        setCommunities(communityData||[]);
      }
      else {
        const base=(data||[]).map(c=>{
          const members=c.conversation_members||[];
          return {...c,me:members.find(m=>m.user_id===user.id),other:members.find(m=>m.user_id!==user.id)};
        }).filter(c=>c.me);

        // Merge explicit pending memberships into the conversation list. This
        // protects incoming requests even when the normal conversation query or
        // inbox summary does not return them.
        if(tab==='Requests' && !requestsResult.error){
          const existing=new Set(base.map(c=>c.id));
          (requestsResult.data||[]).forEach(row=>{
            const c=row.conversations;
            if(!c || existing.has(c.id)) return;
            const members=c.conversation_members||[];
            base.push({...c,me:members.find(m=>m.user_id===user.id)||{
              user_id:user.id,
              request_status:row.request_status,
              is_archived:row.is_archived,
              is_muted:row.is_muted
            },other:members.find(m=>m.user_id!==user.id)});
          });
        } else if(tab==='Requests' && requestsResult.error){
          setError(requestsResult.error.message);
        }

        let inboxRows=[];
        if(!inboxResult.error) inboxRows=inboxResult.data||[];
        else setError(inboxResult.error.message);
        if(sequence!==loadSequence.current||!mountedRef.current)return;
        const latestBy = {};
        const unreadBy = {};
        (inboxRows||[]).forEach(m => {
          latestBy[m.conversation_id] = {
            id:m.last_message_id,
            conversation_id:m.conversation_id,
            sender_id:m.last_sender_id,
            content:m.last_content,
            media_type:m.last_media_type,
            created_at:m.last_created_at
          };
          unreadBy[m.conversation_id] = Number(m.unread_count||0);
        });
        const nextItems=base.map(c=>({...c,lastMessage:latestBy[c.id]||null,unreadCount:unreadBy[c.id]||0})).sort((a,b)=>new Date(b.lastMessage?.created_at||b.created_at).getTime()-new Date(a.lastMessage?.created_at||a.created_at).getTime());
        setItems(nextItems);
        setUnreadTotal(nextItems.reduce((sum,c)=>sum+(c.unreadCount||0),0));
      }
      if(mountedRef.current&&sequence===loadSequence.current){setLoading(false);setRefreshing(false);}
    } finally {
      if(sequence===loadSequence.current)loadInFlight.current=false;
      if(mountedRef.current&&sequence===loadSequence.current&&reloadPending.current){
        reloadPending.current=false;
        setTimeout(()=>{if(mountedRef.current)load();},0);
      }
    }
  },[user?.id,tab]);

  useFocusEffect(useCallback(()=>{ load(); },[load]));

  useEffect(() => {
    mountedRef.current=true;
    if (!user?.id) return;
    const scheduleReload=()=>{
      if(loadInFlight.current){
        reloadPending.current=true;
        return;
      }
      if(reloadTimer.current)return;
      reloadTimer.current=setTimeout(()=>{
        reloadTimer.current=null;
        load();
      },250);
    };
    const channel = supabase.channel('messages-inbox-' + user.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, scheduleReload)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, scheduleReload)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, scheduleReload)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reads', filter: 'user_id=eq.' + user.id }, scheduleReload)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_members', filter: 'user_id=eq.' + user.id }, scheduleReload)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversation_members', filter: 'user_id=eq.' + user.id }, scheduleReload)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'conversation_members', filter: 'user_id=eq.' + user.id }, scheduleReload)
      .subscribe();
    return () => {
      mountedRef.current=false;
      loadSequence.current+=1;
      if(reloadTimer.current){clearTimeout(reloadTimer.current);reloadTimer.current=null;}
      reloadPending.current=false;
      supabase.removeChannel(channel);
    };
  }, [user?.id, load]);

  const change = async (c,patch) => {
    const { error:e } = await supabase.from('conversation_members').update(patch).eq('conversation_id',c.id).eq('user_id',user.id);
    if (e) setError(e.message); else load();
  };

  const rows = useMemo(() => {
    const filtered = items.filter(c => {
      const p=c.other?.profiles;
      const n=c.kind==='group'?(c.title||'Group'):p?.display_name||p?.username||c.title||'Conversation';
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
        <ScrollView style={s.mobileScroll} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} />} contentContainerStyle={s.mobileList}>
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
  const unread=c.unreadCount>0 && tab==='Messages';
  return <View style={s.row}>
    <Pressable onPress={open} style={({pressed})=>[s.rowMain,pressed&&s.rowPressed]}>
      {p?.avatar_url?<Image source={{uri:getImageUrl(p.avatar_url,{width:800,height:800,quality:100})}} style={s.avatar}/>:<View style={s.avatar}><Text style={s.avatarText}>{n[0]?.toUpperCase()}</Text></View>}
      <View style={s.rowInfo}>
        <View style={s.rowTop}><Text style={[s.name,unread&&s.unreadName]} numberOfLines={1}>{n}</Text>{c.lastMessage?<Text style={[s.time,unread&&s.unreadTime]}>{relative(c.lastMessage.created_at)}</Text>:null}</View>
        <View style={s.previewLine}><Text style={[s.preview,unread&&s.unreadPreview]} numberOfLines={1}>{mine?'You: ':''}{preview}</Text>{unread?<View style={s.unreadBadge}><Text style={s.unreadBadgeText}>{c.unreadCount>99?'99+':c.unreadCount}</Text></View>:null}</View>
      </View>
    </Pressable>
    {tab==='Requests' ? <View style={s.requestActions}><Pressable onPress={accept} style={({pressed})=>[s.accept,pressed&&s.pressed]}><Text style={s.acceptText}>Accept</Text></Pressable><Pressable onPress={decline} style={({pressed})=>[s.decline,pressed&&s.pressed]}><Text style={s.declineText}>Decline</Text></Pressable></View> : <Pressable accessibilityLabel={tab==='Archived'?'Unarchive conversation':'Archive conversation'} onPress={archive} style={({pressed})=>[s.archive,pressed&&s.pressed]}><AppIcon name="archive" size={14} color="#93A7BC"/></Pressable>}
  </View>;
}
function ConversationPreview(){return <View style={s.previewPanel}><Text style={s.previewHint}>Select a conversation</Text><Text style={s.previewTitle}>Your conversations live here</Text><Text style={s.previewBody}>Open a message to continue the conversation.</Text></View>}
function QuickRail({requestCount,archiveCount,router,onArchive}){return <View style={s.quickRail}><View style={s.quickCard}><Text style={s.quickTitle}>Quick Access</Text><View style={s.quickGrid}><Quick icon="users" label="My Communities" onPress={()=>router.push('/communities')}/><Quick icon="archive" label="Archive" value={archiveCount} onPress={onArchive}/></View></View><View style={s.quickCard}><Text style={s.quickTitle}>Inbox</Text><QuickLine label="Hidden Requests" value={requestCount}/><QuickLine label="Archived chats" value={archiveCount}/><Pressable onPress={()=>router.push('/new-message')} style={s.railNew}><Text style={s.railNewText}>Start a new conversation</Text><AppIcon name="arrow-right" size={12} color={C.white}/></Pressable></View><View style={s.railPromo}><Image source={require('../../public/brand/freetopia-mark.png')} style={s.promoLogo}/><Text style={s.promoTitle}>Freetopia</Text><Text style={s.promoBody}>One conversation at a time.</Text></View></View>}
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
function Empty({tab}){return <EmptyState icon={tab==='Archived'?'archive':'message'} title={tab==='Requests'?'No message requests.':tab==='Archived'?'No archived conversations.':'No conversations yet.'} body={tab==='Requests'?'New requests from people you do not follow will appear here.':'Start a real conversation from someone’s profile or the New button.'}/>}
function Error({text}){return <View style={s.error}><Text style={s.errorTitle}>Couldn't load messages</Text><Text style={s.errorText}>{text}</Text></View>}
function Loading(){return <LoadingState label="Loading conversations…" rows={4}/>}
function Badge({n}){return <View style={s.badge}><Text style={s.badgeText}>{n>99?'99+':n}</Text></View>}
function relative(v){const m=Math.max(0,Math.floor((Date.now()-new Date(v).getTime())/60000));if(m<1)return 'now';if(m<60)return m+'m';const h=Math.floor(m/60);if(h<24)return h+'h';return Math.floor(h/24)+'d'}

const s=StyleSheet.create({mobileScroll:{flex:1},mobileList:{paddingBottom:108,paddingTop:0},pressed:{opacity:.72,transform:[{scale:.985}]},
 safe:{flex:1,backgroundColor:C.bg},desktopShell:{flex:1,flexDirection:'row',backgroundColor:C.bg},sidebar:{width:225,padding:18,paddingTop:26,borderRightWidth:1,borderRightColor:C.line,backgroundColor:'#060D16'},brand:{flexDirection:'row',alignItems:'center',gap:9},logo:{width:34,height:34},brandText:{color:C.text,fontSize:18,fontWeight:'800'},sideNav:{marginTop:35,gap:5},sideItem:{minHeight:46,paddingHorizontal:12,borderRadius:10,flexDirection:'row',alignItems:'center',gap:13},active:{backgroundColor:'#182536'},sideIcon:{width:22,color:'#AFC0D3',fontSize:19,textAlign:'center'},sideLabel:{color:'#C9D4E2',fontSize: 15,fontWeight:'600',flex:1},badge:{minWidth:20,height:20,borderRadius:10,backgroundColor:C.violet,alignItems:'center',justifyContent:'center'},badgeText:{color:C.white,fontSize: 15,fontWeight:'800'},proCard:{marginTop:'auto',borderWidth:1,borderColor:'#273546',borderRadius:12,padding:13,backgroundColor:'#111B28'},proTitle:{color:C.text,fontSize: 15,fontWeight:'800'},proBody:{color:'#BDB6E6',fontSize: 15,lineHeight:14,marginTop:6},proButton:{height:30,borderRadius:15,backgroundColor:C.blue,alignItems:'center',justifyContent:'center',marginTop:10},proButtonText:{color:C.white,fontSize: 15,fontWeight:'800'},
 desktopMain:{flex:1},topbar:{height:64,borderBottomWidth:1,borderBottomColor:C.line,flexDirection:'row',alignItems:'center',paddingHorizontal:24,gap:20},search:{height:36,backgroundColor:'#101D30',borderRadius:9,paddingHorizontal:14,color:C.text,fontSize: 15,flex:1,maxWidth:510,borderWidth:1,borderColor:'#172D46'},topIcons:{marginLeft:'auto',flexDirection:'row',alignItems:'center',gap:20},topIconButton:{width:30,height:30,alignItems:'center',justifyContent:'center'},topIcon:{color:C.text,fontSize:20},topUnreadDot:{position:'absolute',right:-7,top:-5,minWidth:15,height:15,paddingHorizontal:3,borderRadius:8,backgroundColor:C.violet,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:C.bg},topUnreadText:{color:C.white,fontSize:7,fontWeight:'800'},topAvatar:{width:31,height:31,borderRadius:16,backgroundColor:'#324761',alignItems:'center',justifyContent:'center'},topAvatarText:{color:C.text,fontSize: 14,fontWeight:'800'},desktopBody:{flex:1,flexDirection:'row',padding:12,gap:12},inbox:{width:315,borderWidth:1,borderColor:C.line,borderRadius:12,overflow:'hidden',backgroundColor:C.panel},inboxHead:{padding:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},kicker:{color:C.blue,fontSize: 15,fontWeight:'800',letterSpacing:1.4},title:{color:C.text,fontSize:21,fontWeight:'800',marginTop:3},new:{height:32,paddingHorizontal:11,borderRadius:9,backgroundColor:C.violet,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},newText:{color:C.white,fontSize: 14,fontWeight:'800'},tabs:{gap:4,paddingHorizontal:10,paddingBottom:8},tab:{height:32,paddingHorizontal:13,borderRadius:16,flexDirection:'row',alignItems:'center',gap:5},tabSelected:{backgroundColor:'#172B43',borderWidth:1,borderColor:'#294866'},tabText:{color:'#718399',fontSize: 14,fontWeight:'700'},tabSelectedText:{color:'#F0F4F8',fontWeight:'800'},count:{minWidth:16,height:16,borderRadius:8,backgroundColor:C.violet,alignItems:'center',justifyContent:'center'},countText:{color:C.white,fontSize: 14,fontWeight:'800'},row:{minHeight:72,paddingHorizontal:13,paddingVertical:9,borderTopWidth:1,borderTopColor:'#12202E',flexDirection:'row',alignItems:'center',gap:10,backgroundColor:'#09121C'},rowMain:{flex:1,flexDirection:'row',alignItems:'center',gap:11,minWidth:0},avatar:{width:44,height:44,borderRadius:22,backgroundColor:'#1B3046',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#35506C'},avatarText:{color:C.text,fontSize:15,fontWeight:'800'},rowInfo:{flex:1,minWidth:0,paddingVertical:1},rowPressed:{opacity:.72},previewLine:{flexDirection:'row',alignItems:'center',minWidth:0},unreadName:{color:'#F1F5F8'},unreadTime:{color:'#9CB5CF'},unreadPreview:{color:'#A8B8C8',fontWeight:'600'},rowTop:{flexDirection:'row',alignItems:'center',gap:8},name:{color:'#DCE5EE',fontSize: 14,fontWeight:'800',flex:1},time:{color:'#687A8E',fontSize: 15,fontWeight:'600'},preview:{color:'#8191A4',fontSize: 14,lineHeight:15,marginTop:3,flex:1},unreadBadge:{minWidth:19,height:19,paddingHorizontal:5,borderRadius:10,backgroundColor:'#4B78A8',alignItems:'center',justifyContent:'center',marginLeft:8},unreadBadgeText:{color:C.white,fontSize: 14,fontWeight:'800'},requestActions:{flexDirection:'row',gap:5,marginLeft:6},accept:{paddingHorizontal:10,height:28,borderRadius:14,backgroundColor:C.blue,alignItems:'center',justifyContent:'center'},acceptText:{color:C.white,fontSize: 15,fontWeight:'800'},decline:{paddingHorizontal:9,height:28,borderRadius:14,borderWidth:1,borderColor:'#344B64',alignItems:'center',justifyContent:'center'},declineText:{color:'#B8C5D3',fontSize: 15,fontWeight:'700'},archive:{width:32,height:32,borderRadius:16,borderWidth:1,borderColor:'#21364D',alignItems:'center',justifyContent:'center',marginLeft:4},archiveText:{color:'#91A3B8',fontSize:7,fontWeight:'700'},previewPanel:{flex:1,borderWidth:1,borderColor:C.line,borderRadius:12,backgroundColor:'#050B13',alignItems:'center',justifyContent:'center'},previewHint:{color:C.blue,fontSize: 15,fontWeight:'800',letterSpacing:1},previewTitle:{color:C.text,fontSize:20,fontWeight:'800',marginTop:8},previewBody:{color:C.muted,fontSize: 15,marginTop:5},quickRail:{width:245,gap:12},quickCard:{borderWidth:1,borderColor:C.line,borderRadius:12,backgroundColor:C.panel,padding:13},quickTitle:{color:C.text,fontSize: 14,fontWeight:'800',marginBottom:10},quickGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},quick:{width:'47%',minHeight:58,borderRadius:9,backgroundColor:'#0D1A2A',borderWidth:1,borderColor:'#182C43',padding:8},quickIcon:{color:'#9FB8D5',fontSize:17},quickLabel:{color:'#B7C4D3',fontSize: 14,marginTop:5},quickValue:{color:C.text,fontSize: 14,fontWeight:'800',marginTop:2},quickLine:{height:34,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:C.line},quickLineLabel:{color:'#AAB8C8',fontSize: 15},quickLineValue:{color:C.text,fontSize: 15,fontWeight:'800'},railNew:{marginTop:12,height:34,borderRadius:17,backgroundColor:C.blue,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},railNewText:{color:C.white,fontSize: 14,fontWeight:'800'},railPromo:{borderWidth:1,borderColor:'#273546',borderRadius:12,padding:13,backgroundColor:'#111B28'},promoLogo:{width:32,height:32},promoTitle:{color:C.text,fontSize: 14,fontWeight:'800',marginTop:7},promoBody:{color:'#BEB7E7',fontSize: 15,marginTop:3},
 mobileHead:{height:60,paddingHorizontal:17,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#111D2A'},headActions:{flexDirection:'row',gap:4,alignItems:'center'},icon:{color:C.text,fontSize:21},mobileTitleRow:{paddingHorizontal:17,paddingTop:14,paddingBottom:8,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},mobileTitle:{color:'#F0F4F8',fontSize:24,fontWeight:'800',letterSpacing:-.55},compose:{color:C.text,fontSize:22},mobileList:{paddingBottom:108,paddingTop:2},empty:{margin:14,padding:28,borderWidth:1,borderColor:C.line,borderRadius:14,backgroundColor:C.panel,alignItems:'center'},emptyIcon:{color:C.blue,fontSize:25},emptyTitle:{color:C.text,fontSize:14,fontWeight:'800',marginTop:10,textAlign:'center'},emptyBody:{color:C.muted,fontSize: 14,lineHeight:16,textAlign:'center',marginTop:6,maxWidth:290},communityList:{padding:14,paddingBottom:90},createCommunity:{height:42,borderRadius:10,backgroundColor:'#101F32',borderWidth:1,borderColor:'#1B334D',alignItems:'center',justifyContent:'center',marginBottom:8},createCommunityText:{color:C.text,fontSize: 14,fontWeight:'800'},communityRow:{minHeight:64,flexDirection:'row',alignItems:'center',gap:10,borderBottomWidth:1,borderBottomColor:C.line,paddingVertical:9},communityAvatar:{width:42,height:42,borderRadius:11,backgroundColor:'#202B3A',alignItems:'center',justifyContent:'center'},communityAvatarText:{color:C.text,fontSize:15,fontWeight:'800'},communityName:{color:C.text,fontSize: 15,fontWeight:'800'},communityMembers:{color:C.muted,fontSize: 15,marginTop:4},joined:{paddingHorizontal:9,paddingVertical:6,borderRadius:12,borderWidth:1,borderColor:'#263B52',color:'#B8C8DA',fontSize: 14,fontWeight:'800'},communityBox:{margin:14,padding:30,borderWidth:1,borderColor:C.line,borderRadius:14,backgroundColor:C.panel,alignItems:'center'},communityIcon:{fontSize:28,color:C.violet},error:{margin:10,padding:11,borderWidth:1,borderColor:'#522632',borderRadius:9,backgroundColor:'#1B0D14'},errorTitle:{color:'#FF9BAD',fontSize: 14,fontWeight:'800'},errorText:{color:'#C88B96',fontSize: 15,marginTop:3},loading:{padding:25,alignItems:'center'},muted:{color:C.muted,fontSize: 14}
});

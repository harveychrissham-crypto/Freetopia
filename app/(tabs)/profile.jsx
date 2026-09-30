import { useCallback, useMemo, useRef, useState } from 'react';
import { getImageUrl } from '../../lib/imageUrl';
import { Platform, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { LoadingState } from '../../components/FeedbackState';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import AppIcon from '../../components/AppIcon';
import { useAppearance } from '../../providers/AppearanceProvider';

const C = { bg:'#060B12', panel:'#0A121C', panel2:'#0E1824', line:'#182533', text:'#E9EEF4', muted:'#7F8D9D', blue:'#4B78A8', violet:'#4A3F78', pink:'#7A496F', white:'#F4F6F8' };

export default function Profile() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, profile, signOut } = useAuth();
  const { id:routeId } = useLocalSearchParams();
  const profileId = Array.isArray(routeId) ? routeId[0] : routeId;
  const isOwn = !profileId || profileId === user?.id;
  const desktop = Platform.OS === 'web' && width >= 1000;
  const { colors, accent, textScale } = useAppearance();
  const [counts, setCounts] = useState({ posts:0, following:0, followers:0 });
  const [communities, setCommunities] = useState(0);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('Posts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [viewProfile, setViewProfile] = useState(null); const [followingUser, setFollowingUser] = useState(false); const [followPending, setFollowPending] = useState(false); const [followBusy, setFollowBusy] = useState(false); const mountedRef=useRef(true); const loadSequenceRef=useRef(0);

  const load = useCallback(async (pull=false) => {
    const targetId = profileId || user?.id;
    if (!targetId || !mountedRef.current) return;
    const sequence=++loadSequenceRef.current;
    pull ? setRefreshing(true) : setLoading(true);
    setError('');
    try{
    const profileRequest = isOwn
      ? Promise.resolve({ data: profile, error: null })
      : supabase.from('profiles').select('id,username,display_name,bio,avatar_url,cover_url,website,location,is_private,created_at').eq('id',targetId).maybeSingle();
    const [targetProfile, following, followers, ownPostCount, ownPosts, memberships, relationship] = await Promise.all([
      profileRequest,
      supabase.from('follows').select('*',{count:'exact',head:true}).eq('follower_id',targetId).eq('status','accepted'),
      supabase.from('follows').select('*',{count:'exact',head:true}).eq('following_id',targetId).eq('status','accepted'),
      supabase.from('posts').select('*',{count:'exact',head:true}).eq('author_id',targetId),
      supabase.from('posts').select('id,author_id,content,visibility,community_id,created_at,post_reactions(user_id,reaction_type),post_media(id,storage_path,media_type,width,height,thumbnail_path,sort_order)').eq('author_id',targetId).order('created_at',{ascending:false}).limit(30),
      supabase.from('community_members').select('*',{count:'exact',head:true}).eq('user_id',targetId).eq('status','active'),
      !isOwn && user ? supabase.from('follows').select('id,status').eq('follower_id',user.id).eq('following_id',targetId).maybeSingle() : Promise.resolve({data:null,error:null}),
    ]);
    const firstError = [targetProfile,following,followers,ownPostCount,ownPosts,memberships,relationship].find(x=>x.error)?.error;
    if (firstError) throw firstError;
    if(sequence!==loadSequenceRef.current||!mountedRef.current)return;
    setViewProfile(targetProfile.data || null);
    setFollowingUser(relationship?.data?.status === 'accepted');
    setFollowPending(relationship?.data?.status === 'pending');
    setCounts({ posts:ownPostCount.count || 0, following:following.count||0, followers:followers.count||0 });
    setCommunities(memberships.count||0);
    setPosts(ownPosts.data||[]);
    }catch(err){if(sequence===loadSequenceRef.current&&mountedRef.current)setError(err?.message||'Unable to load profile. Please try again.');}
    finally{if(sequence===loadSequenceRef.current&&mountedRef.current){setLoading(false);setRefreshing(false);}}
  },[user?.id,profileId,isOwn,profile]);

  useFocusEffect(useCallback(()=>{mountedRef.current=true;load();return()=>{mountedRef.current=false;loadSequenceRef.current+=1;};},[load]));

  const displayedProfile = isOwn ? profile : viewProfile;
  const name = displayedProfile?.display_name || displayedProfile?.username || (isOwn ? user?.email?.split('@')[0] : 'Freetopia member');
  const handle = displayedProfile?.username ? '@'+displayedProfile.username : '@freetopia_member';
  const initials = name.charAt(0).toUpperCase();
  const completion = [
    !!displayedProfile?.avatar_url,
    !!displayedProfile?.bio,
    !!displayedProfile?.cover_url,
    counts.following >= 5,
    communities >= 3,
  ];
  const completionPercent = Math.round((completion.filter(Boolean).length / completion.length) * 100);
  const tabs = ['Posts','Replies','Media','Reactions'];
  const visiblePosts = useMemo(() => {
    if (activeTab === 'Posts') return posts;
    if (activeTab === 'Media') return posts.filter(p => p.post_media?.length);
    if (activeTab === 'Reactions') return posts.filter(p => p.post_reactions?.some(x => x.user_id === user?.id));
    return [];
  },[activeTab,posts,user?.id]);

  const toggleFollow = async () => {
    if (!user || isOwn || followBusy || !displayedProfile?.id || !mountedRef.current) return;
    const wasFollowing = followingUser, wasPending = followPending;
    const nextActive = !(wasFollowing || wasPending);
    const status = displayedProfile.is_private ? 'pending' : 'accepted';
    if (nextActive) { if (status === 'accepted') setFollowingUser(true); else setFollowPending(true); }
    else { setFollowingUser(false); setFollowPending(false); }
    setFollowBusy(true); setError('');
    const query = nextActive
      ? supabase.from('follows').insert({follower_id:user.id,following_id:displayedProfile.id,status})
      : supabase.from('follows').delete().eq('follower_id',user.id).eq('following_id',displayedProfile.id);
    try{
      const { error: e } = await query;
      if(!mountedRef.current)return;
      if (e) { setFollowingUser(wasFollowing); setFollowPending(wasPending); setError(e.message); }
      else if (nextActive ? status === 'accepted' : wasFollowing) setCounts(x=>({...x,followers:Math.max(0,x.followers+(nextActive?1:-1))}));
    }catch(err){if(mountedRef.current){setFollowingUser(wasFollowing);setFollowPending(wasPending);setError(err?.message||'Could not update this follow. Please try again.');}}
    finally{if(mountedRef.current)setFollowBusy(false);}
  };

  const profileHeader = (
    <ProfileHeader
      colors={colors}
      profile={displayedProfile}
      name={name}
      handle={handle}
      initials={initials}
      counts={counts}
      joinedAt={displayedProfile?.created_at || user?.created_at}
      onEdit={isOwn ? ()=>router.push('/edit-profile') : undefined}
      onSettings={isOwn ? ()=>router.push('/settings') : undefined}
      isOwn={isOwn}
      following={followingUser}
      pending={followPending}
      followBusy={followBusy}
      onFollow={toggleFollow}
    />
  );

  if (desktop) return (
    <SafeAreaView style={s.safe}>
      <View style={s.desktopShell}>
        <ProfileSidebar name={name} initials={initials} onNavigate={(path)=>router.push(path)} />
        <ScrollView style={s.desktopMain} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} />}>
          <View style={s.desktopGrid}>
            <View style={s.profileColumn}>
              {profileHeader}
              <ProfileTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
              {error ? <ErrorBox message={error}/> : null}
              {loading ? <Loading/> : <ProfilePosts posts={visiblePosts} activeTab={activeTab} profile={displayedProfile} name={name} onPost={(id)=>router.push({pathname:'/post',params:{id}})} />}
            </View>
            <ProfileRail profile={displayedProfile} completion={completion} percent={completionPercent} counts={counts} communities={communities} router={router} isOwn={isOwn} />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} />} contentContainerStyle={s.mobileContent}>
        <View style={s.mobileTop}><Pressable onPress={()=>router.back()}><AppIcon name="arrow-left" size={20} color={C.text}/></Pressable><Text style={[s.mobileTitle,{color:colors.text,fontSize:20*textScale}]}>{isOwn?'Profile':'Profile'}</Text>{isOwn?<Pressable onPress={()=>router.push('/settings')}><AppIcon name="settings" size={18} color={C.text}/></Pressable>:<View style={{width:20}}/>}</View>
        {profileHeader}
        <ProfileTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        {error ? <ErrorBox message={error}/> : null}
        {loading ? <Loading/> : <ProfilePosts posts={visiblePosts} activeTab={activeTab} profile={displayedProfile} name={name} onPost={(id)=>router.push({pathname:'/post',params:{id}})} />}
        {isOwn&&<Pressable onPress={signOut} style={s.signOut}><Text style={s.signOutText}>Sign out</Text></Pressable>}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileSidebar({name,initials,onNavigate}) {
  const items=[['home','Home','/home'],['compass','Explore','/explore'],['users','Communities','/communities'],['message','Messages','/messages'],['bell','Notifications','/notifications'],['plus','Create','/create'],['profile','Profile','/profile'],['settings','Settings','/settings']];
  return <View style={s.sidebar}>
    <View style={s.brand}><Image source={require('../../public/brand/freetopia-mark.png')} style={s.brandLogo}/><Text style={s.brandText}>Freetopia</Text></View>
    <View style={s.sideNav}>{items.map(([icon,label,path])=><Pressable key={label} onPress={()=>onNavigate(path)} style={[s.sideItem,label==='Profile'&&s.activeSide]}><View style={s.sideIcon}><AppIcon name={icon} size={18} color={label==='Profile'?C.text:C.muted}/></View><Text style={s.sideLabel}>{label}</Text></Pressable>)}</View>
    <Pressable onPress={()=>onNavigate('/profile')} style={s.sideProfile}><Avatar initials={initials}/><View style={{flex:1}}><Text style={s.sideName}>{name}</Text><Text style={s.sideSub}>Profile</Text></View><AppIcon name="chevron-down" size={15} color={C.muted}/></Pressable>
  </View>;
}
function ProfileHeader({colors,profile,name,handle,initials,counts,joinedAt,onEdit,onSettings,isOwn,following,pending,followBusy,onFollow}) {
  return <View style={s.profileHeader}>
    <View style={s.cover}>{profile?.cover_url?<Image source={{uri:getImageUrl(profile.cover_url,{width:2000,height:1000,quality:100})}} style={s.coverImage}/>:<><View style={s.coverGlowA}/><View style={s.coverGlowB}/></>}</View>
    <View style={s.profileBody}>
      <Pressable onPress={onEdit} disabled={!onEdit} style={s.avatarWrap}><Avatar initials={initials} uri={profile?.avatar_url}/>{isOwn&&<View style={s.camera}><AppIcon name="photo" size={14} color={C.text}/></View>}</Pressable>
      <View style={s.profileActions}>{isOwn&&<Pressable onPress={onEdit} style={({pressed})=>[s.outline,pressed&&s.pressed]}><Text style={s.outlineText}>Edit Profile</Text></Pressable>}{!isOwn&&<Pressable onPress={onFollow} disabled={followBusy} style={({pressed})=>[s.followButton,(following||pending)&&s.followingButton,pressed&&s.pressed]}><Text style={s.followButtonText}>{followBusy?'…':following?'Following':pending?'Requested':'Follow'}</Text></Pressable>}{onSettings&&<Pressable onPress={onSettings} style={({pressed})=>[s.circle,pressed&&s.pressed]}><AppIcon name="settings" size={18} color={C.text}/></Pressable>}</View>
      <Text style={s.name}>{name}</Text>
      <Text style={s.handle}>{handle}</Text>
      <View style={[s.statsRow,{borderColor:colors.line}]}><Stat n={counts.posts} label="Posts"/><Stat n={counts.followers} label="Followers"/><Stat n={counts.following} label="Following"/></View>
      <Text style={s.bio}>{profile?.bio || 'Dream big. Build bigger. Share your world with Freetopia.'}</Text>
      <View style={s.metaRow}><View style={s.metaItem}><AppIcon name="location" size={13} color={C.muted}/><Text style={s.meta}>{profile?.location || 'Add location'}</Text></View>{profile?.website?<View style={s.metaItem}><AppIcon name="globe" size={13} color={C.muted}/><Text style={s.meta}>{profile.website}</Text></View>:null}<View style={s.metaItem}><AppIcon name="clock" size={13} color={C.muted}/><Text style={s.meta}>Joined {joinedAt ? new Date(joinedAt).getFullYear() : 'recently'}</Text></View></View>
    </View>
  </View>;
}
function Stat({n,label}){return <Text style={s.stat}><Text style={s.statNumber}>{n>=1000?(n/1000).toFixed(1).replace('.0','')+'K':n}</Text> {label}</Text>}
function ProfileTabs({tabs,activeTab,onChange}){return <View style={s.tabs} accessibilityRole="tablist">{tabs.map(tab=><Pressable key={tab} onPress={()=>onChange(tab)} style={s.tab}><Text style={[s.tabText,activeTab===tab&&s.tabActive]}>{tab}</Text>{activeTab===tab?<View style={s.tabLine}/>:null}</Pressable>)}</View>}

function ProfileMedia({media}){const items=[...media].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));const image=items.find(x=>x.media_type==='image');return <View style={s.mediaPreview}>{image?<Image source={{uri:getImageUrl(image.thumbnail_path||image.storage_path,{width:1000,height:1000,quality:90,resize:'contain'})}} style={s.mediaImage}/>:<View style={s.mediaPlaceholder}><Text style={s.mediaText}>{items.some(x=>x.media_type==='video')?'Video attachment':'Media attachment'}</Text></View>}{items.length>1?<View style={s.mediaCount}><Text style={s.mediaCountText}>{items.length} items</Text></View>:null}</View>}
function ProfilePosts({posts,activeTab,profile,name,onPost}) {
  if (activeTab==='Replies') return <Empty title="No replies to show" body={profile?.id ? 'Replies from this profile will appear here when available.' : 'Replies will appear here when you reply to posts.'} />;
  if (!posts.length) return <Empty title={activeTab==='Media'?'No media posts yet':activeTab==='Reactions'?(profile?.id===undefined?'No reactions to show': 'No matching reactions yet'):'Nothing here yet'} body={activeTab==='Posts'?(profile?.id?'Posts from this profile will appear here as they are shared.':'Your posts will appear here as you share them.'):activeTab==='Reactions'?'This view shows posts from this profile that you have reacted to.':'This section only shows data that is currently available.'}/>;
  return <View>{posts.map(post=><Pressable key={post.id} onPress={()=>onPost(post.id)} style={s.post}>
    <View style={s.postHead}><Avatar initials={name?.charAt(0).toUpperCase()||"F"} uri={profile?.avatar_url}/><View style={{flex:1}}><Text style={s.postAuthor}>{name||"Freetopia member"} <Text style={s.postHandle}>· {relative(post.created_at)}</Text></Text><Text style={s.postText}>{post.content||''}</Text></View><AppIcon name="more" size={18} color={C.muted}/></View>
    {post.post_media?.length?<ProfileMedia media={post.post_media}/>:null}
    <View style={s.postActions}><View style={s.actionItem}><AppIcon name="heart" size={15} color={C.muted}/><Text style={s.action}>{post.post_reactions?.filter(x=>x.reaction_type==='like').length||0}</Text></View><View style={s.actionItem}><AppIcon name="comment" size={15} color={C.muted}/><Text style={s.action}>Reply</Text></View><View style={s.actionItem}><AppIcon name="share" size={15} color={C.muted}/><Text style={s.action}>Share</Text></View><AppIcon name="more" size={15} color={C.muted}/></View>
  </Pressable>)}</View>;
}
function ProfileRail({profile,completion,percent,counts,communities,router,isOwn}) {
  return <View style={s.rail}>
    {isOwn&&<View style={s.railCard}><Text style={s.railTitle}>Profile Completion</Text><View style={s.progressRow}><View style={s.progress}><View style={[s.progressFill,{width:percent+'%'}]}/></View><Text style={s.percent}>{percent}%</Text></View>{[['Add a profile photo',completion[0]],['Write a bio',completion[1]],['Add a cover photo',completion[2]],['Follow 5 people',completion[3]],['Join 3 communities',completion[4]]].map(([label,done])=><View key={label} style={s.checkRow}><View style={[s.check,done&&s.checkDone]}>{done?<AppIcon name="check" size={11} color={C.text}/>:null}</View><Text style={s.checkLabel}>{label}</Text></View>)}</View>}
    <View style={s.railCard}><Text style={s.railTitle}>Profile details</Text><Text style={s.railEmpty}>{profile?.website ? 'Website added to this profile.' : 'No website added.'}</Text></View>
    <View style={s.railCard}><Text style={s.railTitle}>Stats</Text><View style={s.statGrid}><MiniStat n={counts.posts} label="Posts"/><MiniStat n={counts.followers} label="Followers"/><MiniStat n={counts.following} label="Following"/></View></View>
    <View style={s.railCard}><Text style={s.railTitle}>Communities</Text><Text style={s.railEmpty}>{communities ? communities+' active communit'+(communities===1?'y':'ies') : 'No active communities yet.'}</Text></View>
    <View style={s.promo}><Image source={require('../../public/brand/freetopia-mark.png')} style={s.promoLogo}/><Text style={s.promoTitle}>Real people. Real conversations.</Text><Text style={s.promoBody}>A bigger world starts with your voice.</Text><Pressable onPress={()=>router.push('/communities')} style={s.promoButton}><Text style={s.promoButtonText}>Explore Communities</Text><AppIcon name="arrow-right" size={14} color={C.text}/></Pressable></View>
  </View>;
}
function MiniStat({n,label}){return <View style={s.mini}><AppIcon name="spark" size={13} color={C.muted}/><Text style={s.miniN}>{n>=1000?(n/1000).toFixed(1).replace('.0','')+'K':n}</Text><Text style={s.miniLabel}>{label}</Text></View>}
function Empty({title,body}){return <View style={s.empty}><Text style={s.emptyTitle}>{title}</Text><Text style={s.emptyBody}>{body}</Text></View>}
function ErrorBox({message}){return <View style={s.error}><Text style={s.errorTitle}>Couldn't load profile</Text><Text style={s.errorBody}>{message}</Text></View>}
function Loading(){return <LoadingState label="Loading your profile…" rows={3}/>}
function Avatar({initials,uri}){return uri?<Image source={{uri:getImageUrl(uri,{width:800,height:800,quality:100})}} style={s.avatar}/>:<View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>}
function relative(value){const m=Math.floor((Date.now()-new Date(value).getTime())/60000);if(m<1)return 'now';if(m<60)return m+'m';const h=Math.floor(m/60);if(h<24)return h+'h';return Math.floor(h/24)+'d'}

const s=StyleSheet.create({mobileScroll:{paddingBottom:104},pressed:{opacity:.72,transform:[{scale:.985}]},
 safe:{flex:1,backgroundColor:C.bg}, desktopShell:{flex:1,flexDirection:'row',backgroundColor:C.bg}, sidebar:{width:225,padding:18,paddingTop:26,borderRightWidth:1,borderRightColor:C.line,backgroundColor:'#060D16'}, brand:{flexDirection:'row',alignItems:'center',gap:9,paddingHorizontal:8,marginBottom:34},brandLogo:{width:34,height:34},brandText:{color:C.text,fontSize:18,fontWeight:'800'},sideNav:{gap:5},sideItem:{minHeight:48,paddingHorizontal:13,borderRadius:10,flexDirection:'row',alignItems:'center',gap:14},activeSide:{backgroundColor:'#13253A',borderWidth:1,borderColor:'#203A55'},sideIcon:{width:22,color:'#A9B6C7',fontSize:20,textAlign:'center'},sideLabel:{color:'#C5CFDC',fontSize: 17,fontWeight:'600',flex:1},badge:{minWidth:20,height:20,borderRadius:10,backgroundColor:'#344A62',alignItems:'center',justifyContent:'center'},badgeText:{color:C.white,fontSize:9,fontWeight:'800'},sideProfile:{marginTop:'auto',padding:10,borderTopWidth:1,borderTopColor:C.line,flexDirection:'row',alignItems:'center',gap:9},sideName:{color:C.text,fontSize: 16,fontWeight:'700'},sideSub:{color:C.muted,fontSize: 14,marginTop:2},sideChevron:{color:C.muted,fontSize:18},
 desktopMain:{flex:1},desktopGrid:{maxWidth:1090,alignSelf:'center',width:'100%',flexDirection:'row',gap:14,padding:14},profileColumn:{flex:1,minWidth:0},rail:{width:270,gap:12},
 profileHeader:{borderWidth:1,borderColor:'#17293B',borderRadius:14,overflow:'hidden',backgroundColor:C.panel},cover:{height:154,backgroundColor:'#0C1724',overflow:'hidden',position:'relative'},coverImage:{width:'100%',height:'100%'},coverGlowA:{position:'absolute',width:'80%',height:'180%',left:-70,top:-70,backgroundColor:'#142B49',opacity:.75,transform:[{rotate:'-18deg'}]},coverGlowB:{position:'absolute',width:'60%',height:'160%',right:-40,top:-50,backgroundColor:'#332448',opacity:.55,transform:[{rotate:'20deg'}]},coverStars:{position:'absolute',top:25,right:28,color:'#B3C4F2',fontSize:18,opacity:.7},
 profileBody:{padding:0,position:'relative'},avatarWrap:{position:'absolute',left:17,top:-45,zIndex:2},avatar:{width:86,height:86,borderRadius:43,backgroundColor:'#26384D',borderWidth:3,borderColor:'#EAF1FA',alignItems:'center',justifyContent:'center'},avatarText:{color:C.text,fontSize:28,fontWeight:'800'},camera:{position:'absolute',right:-1,bottom:0,width:28,height:28,borderRadius:14,backgroundColor:'#07101B',borderWidth:1,borderColor:'#A9C4FF',alignItems:'center',justifyContent:'center'},cameraText:{color:C.text,fontSize: 17},profileActions:{height:60,flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:8,paddingHorizontal:14},outline:{height:40,paddingHorizontal:16,borderRadius:10,borderWidth:1,borderColor:'#40516A',alignItems:'center',justifyContent:'center'},outlineText:{color:C.text,fontSize: 15,fontWeight:'800'},followButton:{height:34,minWidth:82,paddingHorizontal:14,borderRadius:10,backgroundColor:C.blue,alignItems:'center',justifyContent:'center'},followingButton:{backgroundColor:'#15202D',borderWidth:1,borderColor:'#40516A'},followButtonText:{color:C.white,fontSize: 14,fontWeight:'800'},circle:{width:40,height:40,borderRadius:10,borderWidth:1,borderColor:'#40516A',alignItems:'center',justifyContent:'center'},circleText:{color:C.text,fontSize: 16,letterSpacing:1},name:{paddingHorizontal:17,color:'#EDF2F7',fontSize:24,lineHeight:30,fontWeight:'800',letterSpacing:-0.4},handle:{paddingHorizontal:17,color:C.muted,fontSize:16,lineHeight:21,marginTop:2},bio:{paddingHorizontal:17,color:'#D6DEE8',fontSize:16,lineHeight:22,marginTop:8},metaRow:{flexDirection:'row',gap:14,paddingHorizontal:17,marginTop:10,flexWrap:'wrap'},meta:{color:'#9EAEC1',fontSize: 14},statsRow:{flexDirection:'row',paddingHorizontal:17,paddingVertical:12,borderTopWidth:1,borderBottomWidth:1,borderColor:C.line,marginTop:8},stat:{flex:1,color:C.muted,fontSize:13,fontWeight:'700',textAlign:'center'},statNumber:{color:C.text,fontSize:19,fontWeight:'900'},
 tabs:{height:50,marginTop:1,flexDirection:'row',borderWidth:1,borderTopWidth:0,borderColor:C.line,backgroundColor:C.panel},tab:{flex:1,alignItems:'center',justifyContent:'center',position:'relative'},tabText:{color:C.muted,fontSize:16,fontWeight:'700'},tabActive:{color:C.text,fontWeight:'800'},tabLine:{position:'absolute',bottom:0,left:22,right:22,height:2,borderRadius:3,backgroundColor:'#4B78A8'},
 post:{padding:15,borderWidth:1,borderColor:'#14212F',borderTopWidth:0,backgroundColor:'#09121C'},postHead:{flexDirection:'row',alignItems:'flex-start',gap:10},postAuthor:{color:C.text,fontSize: 16,fontWeight:'800'},postHandle:{color:C.muted,fontWeight:'500'},postText:{color:'#D9E2EC',fontSize: 16,lineHeight:19,marginTop:6},more:{color:C.muted,fontSize: 17,letterSpacing:2},mediaPreview:{marginTop:10,height:220,borderRadius:12,overflow:'hidden',backgroundColor:'#08111B',position:'relative'},mediaImage:{width:'100%',height:'100%'},mediaCount:{position:'absolute',right:8,top:8,paddingHorizontal:8,paddingVertical:4,borderRadius:8,backgroundColor:'#08111B'},mediaCountText:{color:C.text,fontSize:9,fontWeight:'800'},mediaPlaceholder:{height:130,borderRadius:11,backgroundColor:'#0F1C2C',borderWidth:1,borderColor:'#1E314A',marginTop:10,alignItems:'center',justifyContent:'center'},mediaText:{color:'#72869E',fontSize: 14},postActions:{flexDirection:'row',alignItems:'center',gap:20,marginTop:11,paddingTop:9,borderTopWidth:1,borderTopColor:C.line},action:{color:'#9EAEC1',fontSize: 14},
 railCard:{borderWidth:1,borderColor:'#14212F',borderRadius:12,backgroundColor:'#09121C',padding:13},railTitle:{color:C.text,fontSize: 17,fontWeight:'800'},progressRow:{flexDirection:'row',alignItems:'center',gap:10,marginTop:10},progress:{flex:1,height:6,borderRadius:5,backgroundColor:'#172A43',overflow:'hidden'},progressFill:{height:6,borderRadius:5,backgroundColor:C.blue},percent:{color:C.text,fontSize: 14,fontWeight:'700'},checkRow:{flexDirection:'row',alignItems:'center',gap:9,marginTop:10},check:{width:18,height:18,borderRadius:9,borderWidth:1,borderColor:'#54708F',alignItems:'center',justifyContent:'center'},checkDone:{backgroundColor:C.blue,borderColor:'#4B78A8'},checkText:{color:C.white,fontSize: 14,fontWeight:'800'},checkLabel:{color:'#B9C6D5',fontSize: 14},railEmpty:{color:C.muted,fontSize: 14,lineHeight:16,marginTop:7},statGrid:{flexDirection:'row',justifyContent:'space-between',marginTop:12},mini:{alignItems:'center',minWidth:65},miniIcon:{color:'#AFC6E3',fontSize:18},miniN:{color:C.text,fontSize: 17,fontWeight:'800',marginTop:3},miniLabel:{color:C.muted,fontSize:9,marginTop:2},promo:{borderWidth:1,borderColor:'#243344',borderRadius:12,padding:13,backgroundColor:'#0C151F'},promoLogo:{width:32,height:32},promoTitle:{color:C.text,fontSize: 15,fontWeight:'800',marginTop:8},promoBody:{color:'#B9B4E2',fontSize:9,lineHeight:14,marginTop:4},promoButton:{height:34,borderRadius:17,backgroundColor:'#334D69',alignItems:'center',justifyContent:'center',marginTop:11},promoButtonText:{color:C.white,fontSize:9,fontWeight:'800'},
 mobileContent:{paddingBottom:40},mobileTop:{height:56,paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{color:C.text,fontSize:28},mobileTitle:{color:'#EAF0F6',fontSize:20,fontWeight:'800'},mobileMore:{fontSize: 18},loading:{padding:30,alignItems:'center'},loadingText:{color:C.muted,fontSize: 15},error:{margin:12,padding:13,borderRadius:11,borderWidth:1,borderColor:'#4B2630',backgroundColor:'#1B0D14'},errorTitle:{color:'#FF9BAD',fontSize: 16,fontWeight:'800'},errorBody:{color:'#C88B96',fontSize: 14,marginTop:4},empty:{margin:14,padding:30,borderWidth:1,borderColor:'#17293B',borderRadius:13,backgroundColor:'#09121C',alignItems:'center'},emptyTitle:{color:C.text,fontSize: 18,fontWeight:'800'},emptyBody:{color:C.muted,fontSize: 14,lineHeight:16,textAlign:'center',marginTop:7},signOut:{margin:14,minHeight:44,borderWidth:1,borderColor:'#5A2730',borderRadius:12,alignItems:'center',justifyContent:'center'},signOutText:{color:'#FF9BAD',fontSize: 15,fontWeight:'700'}
});

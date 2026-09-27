import { useCallback, useMemo, useState } from 'react';
import { getImageUrl } from '../../lib/imageUrl/imageUrl';
import { Platform, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

const C = { bg:'#060B12', panel:'#0A121C', panel2:'#0E1824', line:'#182533', text:'#E9EEF4', muted:'#7F8D9D', blue:'#4B78A8', violet:'#4A3F78', pink:'#7A496F', white:'#F4F6F8' };

export default function Profile() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, profile, signOut } = useAuth();
  const { id:routeId } = useLocalSearchParams();
  const profileId = Array.isArray(routeId) ? routeId[0] : routeId;
  const isOwn = !profileId || profileId === user?.id;
  const desktop = Platform.OS === 'web' && width >= 1000;
  const [counts, setCounts] = useState({ posts:0, following:0, followers:0 });
  const [communities, setCommunities] = useState(0);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('Posts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [viewProfile, setViewProfile] = useState(null); const [followingUser, setFollowingUser] = useState(false); const [followBusy, setFollowBusy] = useState(false);

  const load = useCallback(async (pull=false) => {
    const targetId = profileId || user?.id;
    if (!targetId) return;
    pull ? setRefreshing(true) : setLoading(true);
    setError('');
    const profileRequest = isOwn
      ? Promise.resolve({ data: profile, error: null })
      : supabase.from('profiles').select('id,username,display_name,bio,avatar_url,cover_url,website,location,is_private,created_at').eq('id',targetId).maybeSingle();
    const [targetProfile, following, followers, ownPostCount, ownPosts, memberships, relationship] = await Promise.all([
      profileRequest,
      supabase.from('follows').select('*',{count:'exact',head:true}).eq('follower_id',targetId).eq('status','accepted'),
      supabase.from('follows').select('*',{count:'exact',head:true}).eq('following_id',targetId).eq('status','accepted'),
      supabase.from('posts').select('*',{count:'exact',head:true}).eq('author_id',targetId),
      supabase.from('posts').select('id,author_id,content,visibility,community_id,created_at,post_reactions(user_id,reaction_type),post_media(storage_path,media_type)').eq('author_id',targetId).order('created_at',{ascending:false}).limit(30),
      supabase.from('community_members').select('*',{count:'exact',head:true}).eq('user_id',targetId).eq('status','active'),
      !isOwn && user ? supabase.from('follows').select('id,status').eq('follower_id',user.id).eq('following_id',targetId).maybeSingle() : Promise.resolve({data:null,error:null}),
    ]);
    const firstError = [targetProfile,following,followers,ownPostCount,ownPosts,memberships,relationship].find(x=>x.error)?.error;
    if (firstError) setError(firstError.message);
    setViewProfile(targetProfile.data || null);
    setFollowingUser(relationship?.data?.status === 'accepted');
    setCounts({ posts:ownPostCount.count || 0, following:following.count||0, followers:followers.count||0 });
    setCommunities(memberships.count||0);
    setPosts(ownPosts.data||[]);
    setLoading(false); setRefreshing(false);
  },[user?.id,profileId,isOwn,profile]);

  useFocusEffect(useCallback(()=>{load();},[load]));

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
    if (!user || isOwn || followBusy || !displayedProfile?.id) return;
    const next = !followingUser;
    setFollowingUser(next); setFollowBusy(true); setError('');
    const query = next
      ? supabase.from('follows').insert({follower_id:user.id,following_id:displayedProfile.id,status:'accepted'})
      : supabase.from('follows').delete().eq('follower_id',user.id).eq('following_id',displayedProfile.id);
    const { error: e } = await query;
    if (e) { setFollowingUser(!next); setError(e.message); }
    else setCounts(x=>({...x,followers:Math.max(0,x.followers+(next?1:-1))}));
    setFollowBusy(false);
  };

  const profileHeader = (
    <ProfileHeader
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
        <View style={s.mobileTop}><Pressable onPress={()=>router.back()}><Text style={s.back}>‹</Text></Pressable><Text style={s.mobileTitle}>{isOwn?'Profile':'Profile'}</Text>{isOwn?<Pressable onPress={()=>router.push('/settings')}><Text style={s.mobileMore}>•••</Text></Pressable>:<View style={{width:20}}/>}</View>
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
  const items=[['⌂','Home','/home'],['⌕','Explore','/explore'],['♧','Communities','/communities'],['▱','Messages','/messages'],['♧','Notifications','/notifications'],['＋','Create','/create'],['♙','Profile','/profile']];
  return <View style={s.sidebar}>
    <View style={s.brand}><Image source={require('../../public/brand/freetopia-mark.png')} style={s.brandLogo}/><Text style={s.brandText}>Freetopia</Text></View>
    <View style={s.sideNav}>{items.map(([icon,label,path])=><Pressable key={label} onPress={()=>onNavigate(path)} style={[s.sideItem,label==='Profile'&&s.activeSide]}><Text style={s.sideIcon}>{icon}</Text><Text style={s.sideLabel}>{label}</Text></Pressable>)}</View>
    <Pressable onPress={()=>onNavigate('/profile')} style={s.sideProfile}><Avatar initials={initials}/><View style={{flex:1}}><Text style={s.sideName}>{name}</Text><Text style={s.sideSub}>Profile</Text></View><Text style={s.sideChevron}>⌄</Text></Pressable>
  </View>;
}
function ProfileHeader({profile,name,handle,initials,counts,joinedAt,onEdit,onSettings,isOwn,following,followBusy,onFollow}) {
  return <View style={s.profileHeader}>
    <View style={s.cover}>{profile?.cover_url?<Image source={{uri:getImageUrl(profile.cover_url,{width:2000,height:1000,quality:100})}} style={s.coverImage}/>:<><View style={s.coverGlowA}/><View style={s.coverGlowB}/><Text style={s.coverStars}>✦  ·  ✧   ·   ✦</Text></>}</View>
    <View style={s.profileBody}>
      <Pressable onPress={onEdit} disabled={!onEdit} style={s.avatarWrap}><Avatar initials={initials} uri={profile?.avatar_url}/>{isOwn&&<View style={s.camera}><Text style={s.cameraText}>⌾</Text></View>}</Pressable>
      <View style={s.profileActions}>{isOwn&&<Pressable onPress={onEdit} style={s.outline}><Text style={s.outlineText}>Edit Profile</Text></Pressable>}{!isOwn&&<Pressable onPress={onFollow} disabled={followBusy} style={[s.followButton,following&&s.followingButton]}><Text style={s.followButtonText}>{followBusy?'…':following?'Following':'Follow'}</Text></Pressable>}{onSettings&&<Pressable onPress={onSettings} style={s.circle}><Text style={s.circleText}>•••</Text></Pressable>}</View>
      <Text style={s.name}>{name}</Text>
      <Text style={s.handle}>{handle}</Text>
      <Text style={s.bio}>{profile?.bio || 'Dream big. Build bigger. Share your world with Freetopia.'}</Text>
      <View style={s.metaRow}><Text style={s.meta}>⌖ {profile?.location || 'Add location'}</Text>{profile?.website?<Text style={s.meta}>↗ {profile.website}</Text>:null}<Text style={s.meta}>◷ Joined {joinedAt ? new Date(joinedAt).getFullYear() : 'recently'}</Text></View><View style={s.statsRow}><Stat n={counts.posts} label="posts"/><Stat n={counts.followers} label="followers"/><Stat n={counts.following} label="following"/></View>
    </View>
  </View>;
}
function Stat({n,label}){return <Text style={s.stat}><Text style={s.statNumber}>{n>=1000?(n/1000).toFixed(1).replace('.0','')+'K':n}</Text> {label}</Text>}
function ProfileTabs({tabs,activeTab,onChange}){return <View style={s.tabs} accessibilityRole="tablist">{tabs.map(tab=><Pressable key={tab} onPress={()=>onChange(tab)} style={s.tab}><Text style={[s.tabText,activeTab===tab&&s.tabActive]}>{tab}</Text>{activeTab===tab?<View style={s.tabLine}/>:null}</Pressable>)}</View>}

function ProfilePosts({posts,activeTab,profile,name,onPost}) {
  if (activeTab==='Replies') return <Empty title="No replies to show" body={profile?.id ? 'Replies from this profile will appear here when available.' : 'Replies will appear here when you reply to posts.'} />;
  if (!posts.length) return <Empty title={activeTab==='Media'?'No media posts yet':activeTab==='Reactions'?(profile?.id===undefined?'No reactions to show': 'No matching reactions yet'):'Nothing here yet'} body={activeTab==='Posts'?(profile?.id?'Posts from this profile will appear here as they are shared.':'Your posts will appear here as you share them.'):activeTab==='Reactions'?'This view shows posts from this profile that you have reacted to.':'This section only shows data that is currently available.'}/>;
  return <View>{posts.map(post=><Pressable key={post.id} onPress={()=>onPost(post.id)} style={s.post}>
    <View style={s.postHead}><Avatar initials={name?.charAt(0).toUpperCase()||"F"} uri={profile?.avatar_url}/><View style={{flex:1}}><Text style={s.postAuthor}>{name||"Freetopia member"} <Text style={s.postHandle}>· {relative(post.created_at)}</Text></Text><Text style={s.postText}>{post.content||''}</Text></View><Text style={s.more}>•••</Text></View>
    {post.post_media?.length?<View style={s.mediaPlaceholder}><Text style={s.mediaText}>Media attachment</Text></View>:null}
    <View style={s.postActions}><Text style={s.action}>♡ {post.post_reactions?.filter(x=>x.reaction_type==='like').length||0}</Text><Text style={s.action}>□ Reply</Text><Text style={s.action}>↗ Share</Text><Text style={s.action}>♧</Text></View>
  </Pressable>)}</View>;
}
function ProfileRail({profile,completion,percent,counts,communities,router,isOwn}) {
  return <View style={s.rail}>
    {isOwn&&<View style={s.railCard}><Text style={s.railTitle}>Profile Completion</Text><View style={s.progressRow}><View style={s.progress}><View style={[s.progressFill,{width:percent+'%'}]}/></View><Text style={s.percent}>{percent}%</Text></View>{[['Add a profile photo',completion[0]],['Write a bio',completion[1]],['Add a cover photo',completion[2]],['Follow 5 people',completion[3]],['Join 3 communities',completion[4]]].map(([label,done])=><View key={label} style={s.checkRow}><View style={[s.check,done&&s.checkDone]}><Text style={s.checkText}>{done?'✓':''}</Text></View><Text style={s.checkLabel}>{label}</Text></View>)}</View>}
    <View style={s.railCard}><Text style={s.railTitle}>Profile details</Text><Text style={s.railEmpty}>{profile?.website ? 'Website added to this profile.' : 'No website added.'}</Text></View>
    <View style={s.railCard}><Text style={s.railTitle}>Stats</Text><View style={s.statGrid}><MiniStat n={counts.posts} label="Posts"/><MiniStat n={counts.followers} label="Followers"/><MiniStat n={counts.following} label="Following"/></View></View>
    <View style={s.railCard}><Text style={s.railTitle}>Communities</Text><Text style={s.railEmpty}>{communities ? communities+' active communit'+(communities===1?'y':'ies') : 'No active communities yet.'}</Text></View>
    <View style={s.promo}><Image source={require('../../public/brand/freetopia-mark.png')} style={s.promoLogo}/><Text style={s.promoTitle}>Real people. Real conversations.</Text><Text style={s.promoBody}>A bigger world starts with your voice.</Text><Pressable onPress={()=>router.push('/communities')} style={s.promoButton}><Text style={s.promoButtonText}>Explore Communities →</Text></Pressable></View>
  </View>;
}
function MiniStat({n,label}){return <View style={s.mini}><Text style={s.miniIcon}>◌</Text><Text style={s.miniN}>{n>=1000?(n/1000).toFixed(1).replace('.0','')+'K':n}</Text><Text style={s.miniLabel}>{label}</Text></View>}
function Empty({title,body}){return <View style={s.empty}><Text style={s.emptyTitle}>{title}</Text><Text style={s.emptyBody}>{body}</Text></View>}
function ErrorBox({message}){return <View style={s.error}><Text style={s.errorTitle}>Couldn't load profile</Text><Text style={s.errorBody}>{message}</Text></View>}
function Loading(){return <View style={s.loading}><Text style={s.loadingText}>Loading your profile…</Text></View>}
function Avatar({initials,uri}){return uri?<Image source={{uri}} style={s.avatar}/>:<View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>}
function relative(value){const m=Math.floor((Date.now()-new Date(value).getTime())/60000);if(m<1)return 'now';if(m<60)return m+'m';const h=Math.floor(m/60);if(h<24)return h+'h';return Math.floor(h/24)+'d'}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg}, desktopShell:{flex:1,flexDirection:'row',backgroundColor:C.bg}, sidebar:{width:225,padding:18,paddingTop:26,borderRightWidth:1,borderRightColor:C.line,backgroundColor:'#060D16'}, brand:{flexDirection:'row',alignItems:'center',gap:9,paddingHorizontal:8,marginBottom:34},brandLogo:{width:34,height:34},brandText:{color:C.text,fontSize:18,fontWeight:'800'},sideNav:{gap:5},sideItem:{minHeight:48,paddingHorizontal:13,borderRadius:10,flexDirection:'row',alignItems:'center',gap:14},activeSide:{backgroundColor:'#182536'},sideIcon:{width:22,color:'#A9B6C7',fontSize:20,textAlign:'center'},sideLabel:{color:'#C5CFDC',fontSize:13,fontWeight:'600',flex:1},badge:{minWidth:20,height:20,borderRadius:10,backgroundColor:'#344A62',alignItems:'center',justifyContent:'center'},badgeText:{color:C.white,fontSize:9,fontWeight:'800'},sideProfile:{marginTop:'auto',padding:10,borderTopWidth:1,borderTopColor:C.line,flexDirection:'row',alignItems:'center',gap:9},sideName:{color:C.text,fontSize:12,fontWeight:'700'},sideSub:{color:C.muted,fontSize:10,marginTop:2},sideChevron:{color:C.muted,fontSize:16},
 desktopMain:{flex:1},desktopGrid:{maxWidth:1090,alignSelf:'center',width:'100%',flexDirection:'row',gap:14,padding:14},profileColumn:{flex:1,minWidth:0},rail:{width:270,gap:12},
 profileHeader:{borderWidth:1,borderColor:C.line,borderRadius:13,overflow:'hidden',backgroundColor:C.panel},cover:{height:175,backgroundColor:'#101A2C',overflow:'hidden',position:'relative'},coverImage:{width:'100%',height:'100%'},coverGlowA:{position:'absolute',width:'80%',height:'180%',left:-70,top:-70,backgroundColor:'#172C55',opacity:.75,transform:[{rotate:'-18deg'}]},coverGlowB:{position:'absolute',width:'60%',height:'160%',right:-40,top:-50,backgroundColor:'#4A1D68',opacity:.55,transform:[{rotate:'20deg'}]},coverStars:{position:'absolute',top:25,right:28,color:'#B3C4F2',fontSize:16,opacity:.7},
 profileBody:{padding:0,position:'relative'},avatarWrap:{position:'absolute',left:17,top:-45,zIndex:2},avatar:{width:88,height:88,borderRadius:44,backgroundColor:'#26384D',borderWidth:3,borderColor:'#EAF1FA',alignItems:'center',justifyContent:'center'},avatarText:{color:C.text,fontSize:28,fontWeight:'800'},camera:{position:'absolute',right:-1,bottom:0,width:28,height:28,borderRadius:14,backgroundColor:'#07101B',borderWidth:1,borderColor:'#A9C4FF',alignItems:'center',justifyContent:'center'},cameraText:{color:C.text,fontSize:13},profileActions:{height:65,flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:8,paddingHorizontal:14},outline:{height:34,paddingHorizontal:14,borderRadius:17,borderWidth:1,borderColor:'#40516A',alignItems:'center',justifyContent:'center'},outlineText:{color:C.text,fontSize:10,fontWeight:'800'},followButton:{height:34,minWidth:82,paddingHorizontal:14,borderRadius:17,backgroundColor:C.blue,alignItems:'center',justifyContent:'center'},followingButton:{backgroundColor:'#15202D',borderWidth:1,borderColor:'#40516A'},followButtonText:{color:C.white,fontSize:10,fontWeight:'800'},circle:{width:34,height:34,borderRadius:17,borderWidth:1,borderColor:'#40516A',alignItems:'center',justifyContent:'center'},circleText:{color:C.text,fontSize:12,letterSpacing:1},name:{paddingHorizontal:17,color:C.text,fontSize:22,fontWeight:'800',letterSpacing:-0.4},handle:{paddingHorizontal:17,color:C.muted,fontSize:11,marginTop:2},bio:{paddingHorizontal:17,color:'#D6DEE8',fontSize:12,lineHeight:19,marginTop:8},metaRow:{flexDirection:'row',gap:14,paddingHorizontal:17,marginTop:10,flexWrap:'wrap'},meta:{color:'#9EAEC1',fontSize:10},statsRow:{flexDirection:'row',gap:24,paddingHorizontal:17,paddingTop:15,paddingBottom:15,borderBottomWidth:1,borderBottomColor:C.line},stat:{color:C.muted,fontSize:10,fontWeight:'600'},statNumber:{color:C.text,fontSize:12,fontWeight:'800'},
 tabs:{height:52,marginTop:1,flexDirection:'row',borderWidth:1,borderTopWidth:0,borderColor:C.line,backgroundColor:C.panel},tab:{flex:1,alignItems:'center',justifyContent:'center',position:'relative'},tabText:{color:C.muted,fontSize:11,fontWeight:'700'},tabActive:{color:C.text,fontWeight:'800'},tabLine:{position:'absolute',bottom:0,left:18,right:18,height:3,borderRadius:3,backgroundColor:'#4B78A8'},
 post:{padding:16,borderWidth:1,borderColor:C.line,borderTopWidth:0,backgroundColor:C.panel},postHead:{flexDirection:'row',alignItems:'flex-start',gap:10},postAuthor:{color:C.text,fontSize:12,fontWeight:'800'},postHandle:{color:C.muted,fontWeight:'500'},postText:{color:'#E4EAF1',fontSize:12,lineHeight:19,marginTop:6},more:{color:C.muted,fontSize:13,letterSpacing:2},mediaPlaceholder:{height:130,borderRadius:11,backgroundColor:'#0F1C2C',borderWidth:1,borderColor:'#1E314A',marginTop:10,alignItems:'center',justifyContent:'center'},mediaText:{color:'#72869E',fontSize:10},postActions:{flexDirection:'row',alignItems:'center',gap:22,marginTop:11,paddingTop:9,borderTopWidth:1,borderTopColor:C.line},action:{color:'#9EAEC1',fontSize:10},
 railCard:{borderWidth:1,borderColor:C.line,borderRadius:12,backgroundColor:C.panel,padding:13},railTitle:{color:C.text,fontSize:13,fontWeight:'800'},progressRow:{flexDirection:'row',alignItems:'center',gap:10,marginTop:10},progress:{flex:1,height:6,borderRadius:5,backgroundColor:'#172A43',overflow:'hidden'},progressFill:{height:6,borderRadius:5,backgroundColor:C.blue},percent:{color:C.text,fontSize:10,fontWeight:'700'},checkRow:{flexDirection:'row',alignItems:'center',gap:9,marginTop:10},check:{width:18,height:18,borderRadius:9,borderWidth:1,borderColor:'#54708F',alignItems:'center',justifyContent:'center'},checkDone:{backgroundColor:C.blue,borderColor:'#4B78A8'},checkText:{color:C.white,fontSize:10,fontWeight:'800'},checkLabel:{color:'#B9C6D5',fontSize:10},railEmpty:{color:C.muted,fontSize:10,lineHeight:16,marginTop:7},statGrid:{flexDirection:'row',justifyContent:'space-between',marginTop:12},mini:{alignItems:'center',minWidth:65},miniIcon:{color:'#AFC6E3',fontSize:16},miniN:{color:C.text,fontSize:13,fontWeight:'800',marginTop:3},miniLabel:{color:C.muted,fontSize:9,marginTop:2},promo:{borderWidth:1,borderColor:'#263244',borderRadius:12,padding:13,backgroundColor:'#111B28'},promoLogo:{width:32,height:32},promoTitle:{color:C.text,fontSize:11,fontWeight:'800',marginTop:8},promoBody:{color:'#B9B4E2',fontSize:9,lineHeight:14,marginTop:4},promoButton:{height:34,borderRadius:17,backgroundColor:'#334D69',alignItems:'center',justifyContent:'center',marginTop:11},promoButtonText:{color:C.white,fontSize:9,fontWeight:'800'},
 mobileContent:{paddingBottom:40},mobileTop:{height:54,paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{color:C.text,fontSize:28},mobileTitle:{color:C.text,fontSize:15,fontWeight:'800'},mobileMore:{fontSize:14},loading:{padding:30,alignItems:'center'},loadingText:{color:C.muted,fontSize:11},error:{margin:12,padding:13,borderRadius:11,borderWidth:1,borderColor:'#4B2630',backgroundColor:'#1B0D14'},errorTitle:{color:'#FF9BAD',fontSize:12,fontWeight:'800'},errorBody:{color:'#C88B96',fontSize:10,marginTop:4},empty:{margin:14,padding:28,borderWidth:1,borderColor:C.line,borderRadius:12,backgroundColor:C.panel,alignItems:'center'},emptyTitle:{color:C.text,fontSize:14,fontWeight:'800'},emptyBody:{color:C.muted,fontSize:10,lineHeight:16,textAlign:'center',marginTop:7},signOut:{margin:14,minHeight:44,borderWidth:1,borderColor:'#5A2730',borderRadius:12,alignItems:'center',justifyContent:'center'},signOutText:{color:'#FF9BAD',fontSize:11,fontWeight:'700'}
});

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { getImageUrl } from '../lib/imageUrl';
import { useAuth } from '../providers/AuthProvider';
import { useAppearance } from '../providers/AppearanceProvider';
import AppIcon from '../components/AppIcon';
import { LoadingState } from '../components/FeedbackState';

const C = {
  bg:'#060B12',
  panel:'#0A121C',
  line:'#182533',
  text:'#F2F5F8',
  muted:'#8996A6',
  soft:'#C9D2DC',
  accent:'#4B78A8',
  white:'#FFFFFF',
};

function valueOf(value) {
  return Array.isArray(value) ? value[0] : value;
}

export default function UserProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useAppearance();
  const params = useLocalSearchParams();
  const profileId = valueOf(params.id);
  const mountedRef = useRef(true);
  const sequenceRef = useRef(0);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [counts, setCounts] = useState({ posts:0, followers:0, following:0 });
  const [following, setFollowing] = useState(false);
  const [pending, setPending] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [messageBusy, setMessageBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('grid');

  const load = useCallback(async (pull=false) => {
    if (!profileId || profileId === user?.id || !mountedRef.current) return;
    const sequence = ++sequenceRef.current;
    pull ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const [profileResult, followerResult, followingResult, postsResult, relationship] = await Promise.all([
        supabase.from('profiles').select('id,username,display_name,bio,avatar_url,cover_url,website,location,is_private,created_at').eq('id',profileId).maybeSingle(),
        supabase.from('follows').select('*',{count:'exact',head:true}).eq('following_id',profileId).eq('status','accepted'),
        supabase.from('follows').select('*',{count:'exact',head:true}).eq('follower_id',profileId).eq('status','accepted'),
        supabase.from('posts').select('id,author_id,content,visibility,community_id,created_at,post_media(id,storage_path,media_type,width,height,thumbnail_path,sort_order)').eq('author_id',profileId).order('created_at',{ascending:false}).limit(60),
        user ? supabase.from('follows').select('id,status').eq('follower_id',user.id).eq('following_id',profileId).maybeSingle() : Promise.resolve({data:null,error:null}),
      ]);
      if (sequence !== sequenceRef.current || !mountedRef.current) return;
      if (profileResult.error) throw profileResult.error;
      if (!profileResult.data) throw new Error('This profile could not be found.');
      if (followerResult.error) throw followerResult.error;
      if (followingResult.error) throw followingResult.error;
      if (postsResult.error) throw postsResult.error;
      setProfile(profileResult.data);
      setPosts(postsResult.data || []);
      setCounts({
        posts: postsResult.count ?? postsResult.data?.length ?? 0,
        followers: followerResult.count || 0,
        following: followingResult.count || 0,
      });
      setFollowing(relationship?.data?.status === 'accepted');
      setPending(relationship?.data?.status === 'pending');
    } catch (e) {
      if (sequence === sequenceRef.current && mountedRef.current) setError(e?.message || 'Unable to load this profile.');
    } finally {
      if (sequence === sequenceRef.current && mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [profileId, user?.id]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
      sequenceRef.current += 1;
    };
  }, [load]);

  const toggleFollow = async () => {
    if (!user || !profile || followBusy || profile.id === user.id) return;
    const wasFollowing = following;
    const wasPending = pending;
    const next = !(wasFollowing || wasPending);
    const status = profile.is_private ? 'pending' : 'accepted';
    setFollowBusy(true);
    setError('');
    if (next) {
      setFollowing(status === 'accepted');
      setPending(status === 'pending');
    } else {
      setFollowing(false);
      setPending(false);
    }
    try {
      const query = next
        ? supabase.from('follows').insert({ follower_id:user.id, following_id:profile.id, status })
        : supabase.from('follows').delete().eq('follower_id',user.id).eq('following_id',profile.id);
      const { error:e } = await query;
      if (e) throw e;
      if (mountedRef.current && status === 'accepted' && next) {
        setCounts(x => ({...x, followers:x.followers + 1}));
      } else if (mountedRef.current && wasFollowing && !next) {
        setCounts(x => ({...x, followers:Math.max(0,x.followers - 1)}));
      }
    } catch (e) {
      if (!mountedRef.current) return;
      setFollowing(wasFollowing);
      setPending(wasPending);
      setError(e?.message || 'Could not update the follow.');
    } finally {
      if (mountedRef.current) setFollowBusy(false);
    }
  };

  const messageUser = async () => {
    if (!user || !profile || messageBusy) return;
    setMessageBusy(true);
    setError('');
    try {
      const { data, error:e } = await supabase.rpc('create_message_request', { target_user_id:profile.id });
      if (e) throw e;
      const conversationId = Array.isArray(data) ? data[0] : data;
      if (!conversationId) throw new Error('Could not start this conversation.');
      router.push({ pathname:'/conversation', params:{ id:String(conversationId) } });
    } catch (e) {
      if (mountedRef.current) setError(e?.message || 'Could not start a conversation.');
    } finally {
      if (mountedRef.current) setMessageBusy(false);
    }
  };

  const gridPosts = useMemo(() => {
    if (tab === 'tagged') return [];
    if (tab === 'media') return posts.filter(post => post.post_media?.length);
    return posts;
  }, [posts, tab]);

  if (loading) {
    return <SafeAreaView style={s.safe}><LoadingState label="Loading profile…" rows={3}/></SafeAreaView>;
  }

  if (error && !profile) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.errorScreen}>
          <Pressable onPress={() => router.back()} hitSlop={12}><AppIcon name="arrow-left" size={22} color={C.text}/></Pressable>
          <View style={s.errorBox}><Text style={s.errorTitle}>Couldn't load profile</Text><Text style={s.errorText}>{error}</Text><Pressable onPress={() => load()} style={s.retry}><Text style={s.retryText}>Try again</Text></Pressable></View>
        </View>
      </SafeAreaView>
    );
  }

  const name = profile?.display_name || profile?.username || 'Freetopia member';
  const handle = profile?.username ? '@' + profile.username : '@freetopia_member';
  const initials = name.charAt(0).toUpperCase();
  const isPrivate = !!profile?.is_private;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.text}/>}
      >
        <View style={s.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={s.topButton}>
            <AppIcon name="arrow-left" size={21} color={C.text}/>
          </Pressable>
          <Text style={s.topUsername} numberOfLines={1}>{profile?.username || name}</Text>
          <Pressable hitSlop={12} style={s.topButton}>
            <AppIcon name="more" size={21} color={C.text}/>
          </Pressable>
        </View>

        <View style={s.identityRow}>
          <View style={s.avatarRing}>
            {profile?.avatar_url
              ? <Image source={{uri:getImageUrl(profile.avatar_url,{width:600,height:600,quality:100})}} style={s.avatar}/>
              : <View style={s.avatarFallback}><Text style={s.avatarInitial}>{initials}</Text></View>}
          </View>
          <View style={s.stats}>
            <Stat number={counts.posts} label="Posts"/>
            <Stat number={counts.followers} label="Followers"/>
            <Stat number={counts.following} label="Following"/>
          </View>
        </View>

        <View style={s.bioBlock}>
          <Text style={s.displayName}>{name}</Text>
          <Text style={s.handle}>{handle}</Text>
          {!!profile?.bio && <Text style={s.bio}>{profile.bio}</Text>}
          {!!profile?.website && <Text style={s.website}>{profile.website}</Text>}
          {!!profile?.location && <Text style={s.meta}><AppIcon name="location" size={12} color={C.muted}/> {profile.location}</Text>}
        </View>

        <View style={s.actionRow}>
          <Pressable onPress={toggleFollow} disabled={followBusy} style={({pressed}) => [s.primaryButton, (following || pending) && s.secondaryButton, pressed && s.pressed]}>
            <Text style={[s.primaryText, (following || pending) && s.secondaryText]}>{followBusy ? '…' : following ? 'Following' : pending ? 'Requested' : 'Follow'}</Text>
          </Pressable>
          <Pressable onPress={messageUser} disabled={messageBusy} style={({pressed}) => [s.actionButton, pressed && s.pressed]}>
            <Text style={s.actionText}>{messageBusy ? '…' : 'Message'}</Text>
          </Pressable>
        </View>

        <View style={s.tabs}>
          <Pressable onPress={() => setTab('grid')} style={[s.tab, tab === 'grid' && s.tabActive]} accessibilityRole="tab">
            <AppIcon name="grid" size={22} color={tab === 'grid' ? C.text : C.muted}/>
          </Pressable>
          <Pressable onPress={() => setTab('media')} style={[s.tab, tab === 'media' && s.tabActive]} accessibilityRole="tab">
            <AppIcon name="play" size={22} color={tab === 'media' ? C.text : C.muted}/>
          </Pressable>
          <Pressable onPress={() => setTab('tagged')} style={[s.tab, tab === 'tagged' && s.tabActive]} accessibilityRole="tab">
            <AppIcon name="profile" size={22} color={tab === 'tagged' ? C.text : C.muted}/>
          </Pressable>
        </View>

        {error ? <View style={s.inlineError}><Text style={s.inlineErrorText}>{error}</Text></View> : null}

        {isPrivate && !following ? (
          <View style={s.privateState}>
            <View style={s.privateIcon}><AppIcon name="lock" size={24} color={C.text}/></View>
            <Text style={s.privateTitle}>This account is private</Text>
            <Text style={s.privateText}>Follow this account to see their posts.</Text>
          </View>
        ) : gridPosts.length ? (
          <View style={s.grid}>
            {gridPosts.map(post => <ProfileTile key={post.id} post={post} onPress={() => router.push({pathname:'/post',params:{id:post.id}})}/>)}
          </View>
        ) : (
          <View style={s.empty}><Text style={s.emptyTitle}>{tab === 'tagged' ? 'No tagged posts' : 'No posts yet'}</Text><Text style={s.emptyText}>Posts shared by {name} will appear here.</Text></View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({number,label}) {
  return <View style={s.stat}><Text style={s.statNumber}>{number >= 1000 ? (number/1000).toFixed(1).replace('.0','') + 'K' : number}</Text><Text style={s.statLabel}>{label}</Text></View>;
}

function ProfileTile({post,onPress}) {
  const media = [...(post.post_media || [])].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
  const image = media.find(item => item.media_type === 'image');
  const video = media.find(item => item.media_type === 'video');
  return (
    <Pressable onPress={onPress} style={({pressed}) => [s.tile, pressed && s.tilePressed]}>
      {image ? (
        <Image source={{uri:getImageUrl(image.thumbnail_path || image.storage_path,{width:500,height:500,quality:88,resize:'cover'})}} style={s.tileImage}/>
      ) : video ? (
        <View style={s.tilePlaceholder}><AppIcon name="play" size={27} color={C.text}/><Text style={s.tileCaption}>Video</Text></View>
      ) : (
        <View style={s.textTile}><Text style={s.tileText} numberOfLines={7}>{post.content || 'Freetopia post'}</Text></View>
      )}
      {media.length > 1 ? <View style={s.multi}><AppIcon name="layers" size={14} color={C.text}/></View> : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},
  scroll:{flex:1,backgroundColor:C.bg},
  topBar:{height:58,paddingHorizontal:15,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:C.line},
  topButton:{width:34,height:34,alignItems:'center',justifyContent:'center'},
  topUsername:{flex:1,textAlign:'center',color:C.text,fontSize:17,fontWeight:'800',letterSpacing:-0.2},
  identityRow:{flexDirection:'row',alignItems:'center',paddingHorizontal:18,paddingTop:18,paddingBottom:10},
  avatarRing:{width:92,height:92,borderRadius:46,padding:2,borderWidth:1,borderColor:'#3A4858',alignItems:'center',justifyContent:'center'},
  avatar:{width:84,height:84,borderRadius:42},
  avatarFallback:{width:84,height:84,borderRadius:42,backgroundColor:'#26384D',alignItems:'center',justifyContent:'center'},
  avatarInitial:{color:C.text,fontSize:30,fontWeight:'900'},
  stats:{flex:1,flexDirection:'row',justifyContent:'space-around',marginLeft:13},
  stat:{alignItems:'center',minWidth:65},
  statNumber:{color:C.text,fontSize:18,fontWeight:'800'},
  statLabel:{color:C.soft,fontSize:12,marginTop:4},
  bioBlock:{paddingHorizontal:18,paddingTop:3,paddingBottom:10},
  displayName:{color:C.text,fontSize:15,fontWeight:'800'},
  handle:{color:C.muted,fontSize:13,marginTop:1},
  bio:{color:'#D9E0E8',fontSize:14,lineHeight:19,marginTop:6},
  website:{color:'#7FA7D2',fontSize:14,fontWeight:'600',marginTop:4},
  meta:{color:C.muted,fontSize:12,marginTop:5},
  actionRow:{flexDirection:'row',gap:8,paddingHorizontal:18,paddingBottom:14},
  primaryButton:{flex:1,height:38,borderRadius:9,backgroundColor:C.accent,alignItems:'center',justifyContent:'center'},
  secondaryButton:{backgroundColor:'#15202D',borderWidth:1,borderColor:'#3A4A5D'},
  primaryText:{color:C.white,fontSize:14,fontWeight:'800'},
  secondaryText:{color:C.text},
  actionButton:{flex:1,height:38,borderRadius:9,borderWidth:1,borderColor:'#3A4A5D',backgroundColor:'#0D1722',alignItems:'center',justifyContent:'center'},
  actionText:{color:C.text,fontSize:14,fontWeight:'800'},
  pressed:{opacity:.72},
  tabs:{height:50,flexDirection:'row',borderTopWidth:1,borderBottomWidth:1,borderColor:C.line,backgroundColor:C.panel},
  tab:{flex:1,alignItems:'center',justifyContent:'center',position:'relative'},
  tabActive:{borderBottomWidth:2,borderBottomColor:C.text},
  inlineError:{margin:10,padding:10,borderRadius:8,borderWidth:1,borderColor:'#4B2630',backgroundColor:'#1B0D14'},
  inlineErrorText:{color:'#FF9BAD',fontSize:12,textAlign:'center'},
  grid:{flexDirection:'row',flexWrap:'wrap',gap:2,paddingTop:2},
  tile:{width:'32.9%',aspectRatio:1,backgroundColor:'#0D1722'},
  tilePressed:{opacity:.7},
  tileImage:{width:'100%',height:'100%'},
  tilePlaceholder:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#111D2A'},
  tileCaption:{color:C.muted,fontSize:11,marginTop:5},
  textTile:{flex:1,padding:10,justifyContent:'center',backgroundColor:'#0D1722'},
  tileText:{color:'#DCE4EC',fontSize:12,lineHeight:16},
  multi:{position:'absolute',right:7,top:7},
  empty:{paddingHorizontal:30,paddingVertical:60,alignItems:'center'},
  emptyTitle:{color:C.text,fontSize:18,fontWeight:'800'},
  emptyText:{color:C.muted,fontSize:13,textAlign:'center',marginTop:7},
  privateState:{paddingHorizontal:30,paddingVertical:70,alignItems:'center'},
  privateIcon:{width:58,height:58,borderRadius:29,borderWidth:1,borderColor:'#3A4858',alignItems:'center',justifyContent:'center'},
  privateTitle:{color:C.text,fontSize:17,fontWeight:'800',marginTop:13},
  privateText:{color:C.muted,fontSize:13,textAlign:'center',marginTop:6},
  errorScreen:{flex:1,padding:16},
  errorBox:{flex:1,alignItems:'center',justifyContent:'center',padding:25},
  errorTitle:{color:C.text,fontSize:19,fontWeight:'800'},
  errorText:{color:C.muted,fontSize:14,textAlign:'center',marginTop:7},
  retry:{marginTop:16,paddingHorizontal:20,height:38,borderRadius:9,backgroundColor:C.accent,alignItems:'center',justifyContent:'center'},
  retryText:{color:C.white,fontWeight:'800'},
});

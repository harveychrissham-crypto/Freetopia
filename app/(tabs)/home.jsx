import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

const c={ink:'#17171b',muted:'#696974',line:'#e8e8ec',surface:'#f7f7f9',accent:'#6546f5'};

export default function Home(){
  const r=useRouter();
  const { user, profile } = useAuth();
  const [posts,setPosts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [error,setError]=useState('');

  const loadPosts=useCallback(async (pull=false)=>{
    if(pull)setRefreshing(true);else setLoading(true);
    setError('');
    const {data,error:queryError}=await supabase.from('posts').select('id,author_id,content,visibility,created_at,profiles:author_id(id,username,display_name,avatar_url)').order('created_at',{ascending:false}).limit(30);
    if(queryError){setError(queryError.message);setPosts([]);}else setPosts(data||[]);
    setLoading(false);setRefreshing(false);
  },[]);

  useFocusEffect(useCallback(()=>{loadPosts();},[loadPosts]));
  const displayName=profile?.display_name||user?.email?.split('@')[0]||'Your profile';
  const initials=displayName.charAt(0).toUpperCase();

  return <SafeAreaView style={s.safe}><ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>loadPosts(true)}/>} contentContainerStyle={s.content}>
    <View style={s.header}><View style={s.brand}><Image source={require('../../public/brand/freetopia-mark.png')} style={s.logo}/><Text style={s.wordmark}>freetopia</Text></View><Pressable onPress={()=>r.push('/notifications')} style={s.headerButton}><Text style={s.headerIcon}>♡</Text></Pressable></View>
    <View style={s.heading}><Text style={s.eyebrow}>YOUR WORLD</Text><Text style={s.title}>What’s happening{String.fromCharCode(10)}in your world?</Text><Text style={s.lead}>Express. Discover. Connect. Create. Belong.</Text></View>
    <Pressable onPress={()=>r.push('/create')} style={s.composer}><View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View><View style={{flex:1}}><Text style={s.composerTitle}>What’s on your mind?</Text><Text style={s.composerHint}>Share something with Freetopia</Text></View><View style={s.plus}><Text style={s.plusText}>+</Text></View></Pressable>
    <View style={s.feedHeader}><Text style={s.sectionTitle}>For you</Text><Text style={s.sectionHint}>Posts visible to your account</Text></View>
    {!!error && <View style={s.errorBox}><Text style={s.errorTitle}>Couldn’t load your feed</Text><Text style={s.errorBody}>{error}</Text></View>}
    {!loading && !error && posts.length===0 && <View style={s.empty}><View style={s.emptyIcon}><Text style={{fontSize:20}}>✦</Text></View><Text style={s.emptyTitle}>Your feed is ready</Text><Text style={s.emptyBody}>Create your first post, follow people, or explore communities to start shaping your Freetopia.</Text><Pressable onPress={()=>r.push('/create')} style={s.primary}><Text style={s.primaryText}>Create a post</Text></Pressable></View>}
    {loading && <View style={s.empty}><Text style={s.emptyTitle}>Loading your feed…</Text></View>}
    {posts.map(post=><PostCard key={post.id} post={post}/>) }
  </ScrollView></SafeAreaView>
}

function PostCard({post}){const author=Array.isArray(post.profiles)?post.profiles[0]:post.profiles;const name=author?.display_name||author?.username||'Freetopia member';const handle=author?.username?'@'+author.username:'';return <View style={s.postCard}><View style={s.postHead}><View style={s.avatarSmall}><Text style={s.avatarText}>{name.charAt(0).toUpperCase()}</Text></View><View style={{flex:1}}><Text style={s.postName}>{name}</Text>{!!handle&&<Text style={s.postHandle}>{handle}</Text>}</View></View><Text style={s.postContent}>{post.content}</Text><Text style={s.postTime}>{new Date(post.created_at).toLocaleString()}</Text></View>}

const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#fff'},content:{paddingHorizontal:20,paddingBottom:30},header:{height:58,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},brand:{flexDirection:'row',alignItems:'center',gap:9},logo:{width:32,height:32},wordmark:{fontSize:18,fontWeight:'750',color:c.ink,letterSpacing:-.5},headerButton:{width:40,height:40,borderWidth:1,borderColor:c.line,borderRadius:20,alignItems:'center',justifyContent:'center'},headerIcon:{fontSize:20,color:c.ink},heading:{paddingTop:28,paddingBottom:24},eyebrow:{fontSize:10,fontWeight:'800',letterSpacing:1.5,color:c.accent},title:{marginTop:9,fontSize:31,lineHeight:35,fontWeight:'760',letterSpacing:-1.1,color:c.ink},lead:{marginTop:9,fontSize:14,color:c.muted,lineHeight:21},composer:{flexDirection:'row',alignItems:'center',gap:11,padding:13,borderWidth:1,borderColor:c.line,borderRadius:18,backgroundColor:c.surface},avatar:{width:38,height:38,borderRadius:19,backgroundColor:c.ink,alignItems:'center',justifyContent:'center'},avatarText:{color:'#fff',fontWeight:'750'},composerTitle:{fontSize:14,fontWeight:'650',color:c.ink},composerHint:{marginTop:2,fontSize:11,color:c.muted},plus:{width:34,height:34,borderRadius:17,borderWidth:1,borderColor:c.line,alignItems:'center',justifyContent:'center'},plusText:{fontSize:22,color:c.ink,lineHeight:25},feedHeader:{marginTop:28,marginBottom:10},sectionTitle:{fontSize:16,fontWeight:'750',color:c.ink},sectionHint:{marginTop:3,fontSize:11,color:c.muted},empty:{marginTop:4,padding:22,borderWidth:1,borderColor:c.line,borderRadius:18,backgroundColor:'#fff',alignItems:'center'},emptyIcon:{width:46,height:46,borderRadius:15,backgroundColor:'#efedff',alignItems:'center',justifyContent:'center'},emptyTitle:{marginTop:14,fontSize:17,fontWeight:'700',color:c.ink},emptyBody:{marginTop:7,fontSize:13,lineHeight:20,textAlign:'center',color:c.muted},primary:{marginTop:17,minHeight:44,paddingHorizontal:18,borderRadius:13,backgroundColor:c.ink,alignItems:'center',justifyContent:'center'},primaryText:{color:'#fff',fontSize:13,fontWeight:'700'},errorBox:{padding:16,borderWidth:1,borderColor:'#f0cccc',borderRadius:16,backgroundColor:'#fff8f8'},errorTitle:{fontSize:14,fontWeight:'750',color:'#9e2f2f'},errorBody:{marginTop:5,fontSize:12,lineHeight:18,color:'#7b4a4a'},postCard:{marginTop:10,padding:16,borderWidth:1,borderColor:c.line,borderRadius:18,backgroundColor:'#fff'},postHead:{flexDirection:'row',alignItems:'center',gap:10},avatarSmall:{width:38,height:38,borderRadius:19,backgroundColor:c.ink,alignItems:'center',justifyContent:'center'},postName:{fontSize:13,fontWeight:'750',color:c.ink},postHandle:{marginTop:2,fontSize:11,color:c.muted},postContent:{marginTop:13,fontSize:15,lineHeight:23,color:c.ink},postTime:{marginTop:12,fontSize:10,color:'#9a9aa4'}});
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';

const c={ink:'#17171b',muted:'#696974',line:'#e8e8ec',accent:'#6546f5'};

export default function PostScreen(){
  const {id}=useLocalSearchParams();
  const r=useRouter();
  const {user,profile}=useAuth();
  const [post,setPost]=useState(null);
  const [comments,setComments]=useState([]);
  const [text,setText]=useState('');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');

  const load=useCallback(async()=>{
    if(!id)return;
    setLoading(true);setError('');
    const [postResult,commentsResult]=await Promise.all([
      supabase.from('posts').select('id,content,created_at,profiles:author_id(id,username,display_name)').eq('id',id).maybeSingle(),
      supabase.from('comments').select('id,content,created_at,parent_id,profiles:author_id(id,username,display_name)').eq('post_id',id).is('parent_id',null).order('created_at',{ascending:true}),
    ]);
    if(postResult.error)setError(postResult.error.message);else setPost(postResult.data);
    if(commentsResult.error)setError(commentsResult.error.message);else setComments(commentsResult.data||[]);
    setLoading(false);
  },[id]);

  useFocusEffect(useCallback(()=>{load();},[load]));

  const addComment=async()=>{
    const value=text.trim();
    if(!value||!user||saving)return;
    setSaving(true);setError('');
    const {data,error:insertError}=await supabase.from('comments').insert({post_id:id,author_id:user.id,content:value}).select('id,content,created_at,parent_id,profiles:author_id(id,username,display_name)').single();
    if(insertError)setError(insertError.message);
    else {setComments(current=>[...current,data]);setText('');}
    setSaving(false);
  };

  const author=Array.isArray(post?.profiles)?post.profiles[0]:post?.profiles;
  const name=author?.display_name||author?.username||'Freetopia member';

  return <SafeAreaView style={s.safe}><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
    <View style={s.header}><Pressable onPress={()=>r.back()}><Text style={s.back}>‹</Text></Pressable><Text style={s.headerTitle}>Conversation</Text><View style={{width:30}}/></View>
    <ScrollView contentContainerStyle={s.content}>
      {loading&&<Text style={s.muted}>Loading conversation…</Text>}
      {!!error&&<View style={s.error}><Text style={s.errorText}>{error}</Text></View>}
      {!!post&&<View style={s.post}><Text style={s.author}>{name}</Text><Text style={s.contentText}>{post.content}</Text><Text style={s.time}>{new Date(post.created_at).toLocaleString()}</Text></View>}
      <Text style={s.section}>Replies · {comments.length}</Text>
      {!loading&&comments.length===0&&<View style={s.empty}><Text style={s.emptyTitle}>No replies yet</Text><Text style={s.muted}>Start the conversation.</Text></View>}
      {comments.map(comment=>{const a=Array.isArray(comment.profiles)?comment.profiles[0]:comment.profiles;const n=a?.display_name||a?.username||'Freetopia member';return <View key={comment.id} style={s.comment}><View style={s.commentAvatar}><Text style={s.avatarText}>{n.charAt(0).toUpperCase()}</Text></View><View style={{flex:1}}><Text style={s.commentAuthor}>{n}</Text><Text style={s.commentText}>{comment.content}</Text><Text style={s.time}>{new Date(comment.created_at).toLocaleString()}</Text></View></View>})}
    </ScrollView>
    <View style={s.composer}><TextInput value={text} onChangeText={setText} placeholder="Write a reply…" placeholderTextColor="#9a9aa4" style={s.input} multiline maxLength={1000}/><Pressable onPress={addComment} disabled={saving||!text.trim()} style={[s.send,(saving||!text.trim())&&s.sendDisabled]}><Text style={s.sendText}>{saving?'…':'Send'}</Text></Pressable></View>
  </KeyboardAvoidingView></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#fff'},header:{height:58,paddingHorizontal:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:c.line},back:{fontSize:34,color:c.ink,lineHeight:34},headerTitle:{fontSize:15,fontWeight:'750',color:c.ink},content:{padding:20,paddingBottom:30},muted:{fontSize:12,color:c.muted},error:{padding:12,borderRadius:12,backgroundColor:'#fff7f7',marginBottom:12},errorText:{fontSize:12,color:'#9e2f2f'},post:{paddingBottom:20,borderBottomWidth:1,borderBottomColor:c.line},author:{fontSize:14,fontWeight:'750',color:c.ink},contentText:{marginTop:10,fontSize:16,lineHeight:24,color:c.ink},time:{marginTop:7,fontSize:10,color:'#9a9aa4'},section:{marginTop:22,fontSize:15,fontWeight:'750',color:c.ink},empty:{marginTop:12,padding:18,borderWidth:1,borderColor:c.line,borderRadius:14,alignItems:'center'},emptyTitle:{fontSize:14,fontWeight:'700',color:c.ink,marginBottom:5},comment:{flexDirection:'row',gap:10,paddingVertical:14,borderBottomWidth:1,borderBottomColor:c.line},commentAvatar:{width:34,height:34,borderRadius:17,backgroundColor:c.ink,alignItems:'center',justifyContent:'center'},avatarText:{color:'#fff',fontWeight:'750'},commentAuthor:{fontSize:12,fontWeight:'750',color:c.ink},commentText:{marginTop:4,fontSize:13,lineHeight:20,color:c.ink},composer:{flexDirection:'row',alignItems:'flex-end',gap:8,padding:12,borderTopWidth:1,borderTopColor:c.line,backgroundColor:'#fff'},input:{flex:1,minHeight:42,maxHeight:100,borderWidth:1,borderColor:c.line,borderRadius:14,paddingHorizontal:13,paddingVertical:10,fontSize:13,color:c.ink},send:{height:42,paddingHorizontal:15,borderRadius:14,backgroundColor:c.ink,alignItems:'center',justifyContent:'center'},sendDisabled:{opacity:.35},sendText:{color:'#fff',fontSize:12,fontWeight:'750'}});
import { useCallback, useEffect, useState } from 'react';
import { getImageUrl } from '../lib/imageUrl';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import AppIcon from '../components/AppIcon';

const c={bg:'#060B12',ink:'#E9EEF4',muted:'#7F8D9D',line:'#182533',accent:'#4B78A8',danger:'#A95B69'};
const reasons=['Spam or misleading','Harassment or bullying','Hate or abusive content','Violence or threats','Sexual content','Other'];

function PostPhotoGallery({ media }) {
  return (
    <View
      style={[
        s.photoGallery,
        media.length === 1 && s.photoSingle,
      ]}
    >
      {media.map((item, index) => {
        const uri = item.thumbnail_path || item.storage_path;

        return (
          <View
            key={item.id || item.storage_path || String(index)}
            style={
              media.length === 1
                ? s.photoSingleItem
                : s.photoMultiItem
            }
          >
            <Image
              source={{
                uri: getImageUrl(uri, {
                  width: 1400,
                  height: 1400,
                  quality: 92,
                  resize: 'contain',
                }),
              }}
              style={s.photoImage}
            />
            {media.length > 1 ? (
              <View style={s.photoIndex}>
                <Text style={s.photoIndexText}>
                  {index + 1}/{media.length}
                </Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function PostVideo({media}){const ready=media.processing_status==='ready'&&!!media.playback_url;const player=useVideoPlayer(ready?{uri:media.playback_url,contentType:'hls',useCaching:true}:null,p=>{p.muted=false;});if(!ready)return <View style={s.videoStatus}><Text style={s.videoStatusTitle}>{media.processing_status==='failed'?'Video processing failed':'Video processing…'}</Text><Text style={s.videoStatusText}>{media.processing_status==='failed'?'This video is unavailable right now.':'Freetopia is preparing this video for smooth playback.'}</Text></View>;return <View style={s.videoWrap}>{media.thumbnail_path?<Image source={{uri:getImageUrl(media.thumbnail_path,{width:1200,height:675,quality:85})}} style={s.videoPoster}/>:null}<VideoView player={player} style={s.video} nativeControls fullscreenOptions={{enable:true}} contentFit="contain" surfaceType={Platform.OS==='android'?'textureView':undefined}/></View>}

export default function PostScreen(){
 const params=useLocalSearchParams(),id=Array.isArray(params.id)?params.id[0]:params.id,r=useRouter(),{user}=useAuth();
 const[post,setPost]=useState(null),[comments,setComments]=useState([]),[commentReactions,setCommentReactions]=useState({}),[text,setText]=useState(''),[replyTo,setReplyTo]=useState(null),[liked,setLiked]=useState(false),[reactionCount,setReactionCount]=useState(0);
 const[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const[reportOpen,setReportOpen]=useState(false),[reportTarget,setReportTarget]=useState(null),[reportReason,setReportReason]=useState(''),[reportDetails,setReportDetails]=useState(''),[reportSaving,setReportSaving]=useState(false),[reportedTargets,setReportedTargets]=useState([]);

 const load=useCallback(async()=>{
  if(!id)return;
  setLoading(true);setError('');
  const [postResult,commentsResult]=await Promise.all([
   supabase.from('posts').select('id,content,created_at,author_id,community_id,profiles:author_id(id,username,display_name,avatar_url),communities:community_id(id,name),post_reactions(user_id,reaction_type),post_media(id,storage_path,media_type,width,height,duration_seconds,sort_order,processing_status,playback_url,thumbnail_path)').eq('id',id).maybeSingle(),
   supabase.from('comments').select('id,content,created_at,parent_id,profiles:author_id(id,username,display_name)').eq('post_id',id).order('created_at',{ascending:true}),
  ]);
  if(postResult.error)setError(postResult.error.message);else { setPost(postResult.data); const reactions=postResult.data?.post_reactions||[]; setReactionCount(reactions.filter(x=>x.reaction_type==='like').length); setLiked(reactions.some(x=>x.user_id===user?.id&&x.reaction_type==='like')); }
  if(commentsResult.error)setError(commentsResult.error.message);else setComments(commentsResult.data||[]);
  setLoading(false);
 },[id,user?.id]);

 useFocusEffect(useCallback(()=>{load();},[load]));
 useEffect(()=>{
  if(!id)return;
  let active=true;
  const hydrate=async()=>{
   const {data:rows,error:e}=await supabase.from('comments').select('id').eq('post_id',id);
   if(!active||e||!rows?.length)return;
   const {data:reactions,error:re}=await supabase.from('comment_reactions').select('comment_id,user_id,reaction_type').in('comment_id',rows.map(x=>x.id));
   if(active&&!re){const map={};(reactions||[]).forEach(x=>{map[x.comment_id]??=[];map[x.comment_id].push(x);});setCommentReactions(map);}
  };
  hydrate();
  const ch=supabase.channel('post-comment-reactions-'+id).on('postgres_changes',{event:'*',schema:'public',table:'comment_reactions'},()=>hydrate()).subscribe();
  return()=>{active=false;supabase.removeChannel(ch);};
 },[id,comments.length]);

 const toggleCommentReaction=async(commentId)=>{
  if(!user)return;
  const rows=commentReactions[commentId]||[];const mine=rows.find(x=>x.user_id===user.id);const next=!mine;
  setCommentReactions(current=>{const list=current[commentId]||[];return {...current,[commentId]:next?[...list,{comment_id:commentId,user_id:user.id,reaction_type:'like'}]:list.filter(x=>x.user_id!==user.id)};});
  const q=next?supabase.from('comment_reactions').upsert({comment_id:commentId,user_id:user.id,reaction_type:'like'}):supabase.from('comment_reactions').delete().eq('comment_id',commentId).eq('user_id',user.id);
  const {error:e}=await q;if(e){setError(e.message);setCommentReactions(current=>({...current,[commentId]:rows}));}
 };


 useEffect(()=>{
  if(!id)return;
  let active=true;
  const hydrateComment=async(record)=>{
   if(!record?.id)return;
   const{data,error:e}=await supabase.from('comments').select('id,content,created_at,parent_id,profiles:author_id(id,username,display_name)').eq('id',record.id).maybeSingle();
   if(!active||e||!data)return;
   setComments(current=>{
    const exists=current.some(comment=>comment.id===data.id);
    const next=exists?current.map(comment=>comment.id===data.id?data:comment):[...current,data];
    return next.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
   });
  };
  const channel=supabase.channel(`post-comments-${id}`)
   .on('postgres_changes',{event:'INSERT',schema:'public',table:'comments',filter:`post_id=eq.${id}`},payload=>{hydrateComment(payload.new);})
   .on('postgres_changes',{event:'UPDATE',schema:'public',table:'comments',filter:`post_id=eq.${id}`},payload=>{hydrateComment(payload.new);})
   .on('postgres_changes',{event:'DELETE',schema:'public',table:'comments'},payload=>{
    const old=payload.old;
    if(!old?.id)return;
    setComments(current=>current.filter(comment=>comment.id!==old.id));
    setReplyTo(current=>current?.id===old.id?null:current);
   })
   .subscribe();
  return()=>{active=false;supabase.removeChannel(channel);};
 },[id]);

 const addComment=async()=>{
  const value=text.trim();if(!value||!user||saving)return;
  setSaving(true);setError('');
  const{data,error:insertError}=await supabase.from('comments').insert({post_id:id,author_id:user.id,content:value,parent_id:replyTo?.id||null}).select('id,content,created_at,parent_id,profiles:author_id(id,username,display_name)').single();
  if(insertError)setError(insertError.message);else{setComments(current=>current.some(comment=>comment.id===data.id)?current:[...current,data].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)));setText('');setReplyTo(null);}
  setSaving(false);
 };

 const toggleLike=async()=>{if(!user||!post)return;const next=!liked;setLiked(next);setReactionCount(v=>Math.max(0,v+(next?1:-1)));const q=next?supabase.from('post_reactions').insert({post_id:post.id,user_id:user.id,reaction_type:'like'}):supabase.from('post_reactions').delete().eq('post_id',post.id).eq('user_id',user.id).eq('reaction_type','like');const{error:e}=await q;if(e){setLiked(!next);setReactionCount(v=>Math.max(0,v+(next?-1:1)));setError(e.message);}};
 const sharePost=async()=>{try{await Share.share({message:post?.content||'Check out this post on Freetopia.'});}catch{}};

 const openReport=(target)=>{setReportTarget(target);setReportReason('');setReportDetails('');setReportOpen(true);};

 const closeReport=()=>{setReportOpen(false);setReportTarget(null);setReportReason('');setReportDetails('');};

 const submitReport=async()=>{
  if(!user||!reportReason||reportSaving||!reportTarget)return;
  setReportSaving(true);setError('');
  const{error:e}=await supabase.from('moderation_reports').insert({
   reporter_id:user.id,reported_user_id:reportTarget.reported_user_id,post_id:reportTarget.post_id||null,comment_id:reportTarget.comment_id||null,reason:reportReason,details:reportDetails.trim()||null
  });
  if(e)setError(e.message);else{const key=reportTarget.comment_id?'comment:'+reportTarget.comment_id:'post:'+reportTarget.post_id;setReportedTargets(current=>current.includes(key)?current:[...current,key]);closeReport();}
  setReportSaving(false);
 };

 const author=Array.isArray(post?.profiles)?post.profiles[0]:post?.profiles;
 const community=Array.isArray(post?.communities)?post.communities[0]:post?.communities;
 const name=author?.display_name||author?.username||'Freetopia member';
 const openAuthor=()=>{if(author?.id)r.push({pathname:'/profile',params:{id:author.id}})};
 const postReportKey=post?'post:'+post.id:'';
 const canReport=!!user&&post?.author_id!==user.id&&!reportedTargets.includes(postReportKey);

 return <SafeAreaView style={s.safe}><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
  <View style={s.header}><Pressable onPress={()=>r.back()}><AppIcon name="arrow-left" size={18}/></Pressable><Text style={s.headerTitle}>Post</Text><View style={{width:30}}/></View>
  <ScrollView contentContainerStyle={s.content}>
   {loading&&<Text style={s.muted}>Loading post…</Text>}
   {!loading&&!post&&!error&&<Text style={s.muted}>This post is unavailable or has been removed.</Text>}
   {!!error&&<View style={s.error}><Text style={s.errorText}>{error}</Text></View>}
   {!!post&&<View style={s.post}>
    <View style={s.postTop}><Pressable onPress={openAuthor} style={s.authorWrap}>{author?.avatar_url?<Image source={{uri:getImageUrl(author.avatar_url,{width:800,height:800,quality:100})}} style={s.authorAvatar}/>:<View style={s.authorFallback}><Text style={s.avatarText}>{name.charAt(0).toUpperCase()}</Text></View>}<View style={{flex:1}}><Text style={s.author}>{name}</Text>{author?.username&&<Text style={s.handle}>@{author.username}</Text>}{community?.name&&<Pressable onPress={()=>r.push({pathname:'/community',params:{id:community.id}})}><Text style={s.community}>in {community.name}</Text></Pressable>}</View>
    </Pressable>{canReport&&<Pressable onPress={()=>openReport({post_id:post.id,reported_user_id:post.author_id})}><Text style={s.reportLink}>Report</Text></Pressable>}
    {reportedTargets.includes(postReportKey)&&<Text style={s.reported}>Reported</Text>}
    </View>
    {post.content?<Text style={s.contentText}>{post.content}</Text>:null}{(post.post_media||[]).filter(m=>m.media_type==='image').sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).length?<PostPhotoGallery media={(post.post_media||[]).filter(m=>m.media_type==='image').sort((a,b)=>(a.sort_order||0)-(b.sort_order||0))}/>:null}{(post.post_media||[]).filter(m=>m.media_type==='video').sort((a,b)=>(a.sort_order||0)-(b.sort_order||0))[0]?<PostVideo media={(post.post_media||[]).filter(m=>m.media_type==='video').sort((a,b)=>(a.sort_order||0)-(b.sort_order||0))[0]}/>:null}<Text style={s.time}>{new Date(post.created_at).toLocaleString()}</Text><View style={s.postActions}><Pressable onPress={toggleLike} style={s.postAction}><Text style={[s.postActionIcon,liked&&s.liked]}>♥</Text><Text style={s.postActionText}>{reactionCount}</Text></Pressable><Pressable onPress={sharePost} style={s.postAction}><Text style={s.postActionIcon}>↗</Text><Text style={s.postActionText}>Share</Text></Pressable></View>
   </View>}
   {reportOpen&&<View style={s.reportBox}>
    <Text style={s.reportTitle}>Report {reportTarget?.comment_id?'this reply':'this post'}</Text><Text style={s.reportLead}>Choose the reason that best describes the issue.</Text>
    <View style={s.reasonList}>{reasons.map(reason=><Pressable key={reason} onPress={()=>setReportReason(reason)} style={[s.reason,!reportReason||reportReason!==reason?null:s.reasonSelected]}><Text style={[s.reasonText,reportReason===reason&&s.reasonTextSelected]}>{reason}</Text></Pressable>)}</View>
    <TextInput value={reportDetails} onChangeText={setReportDetails} placeholder="Additional details (optional)" placeholderTextColor="#9a9aa4" style={s.details} multiline maxLength={500}/>
    <View style={s.reportActions}><Pressable onPress={closeReport} style={s.cancel}><Text style={s.cancelText}>Cancel</Text></Pressable><Pressable disabled={!reportReason||reportSaving} onPress={submitReport} style={[s.submit,!reportReason&&s.submitDisabled]}><Text style={s.submitText}>{reportSaving?'Sending…':'Submit report'}</Text></Pressable></View>
   </View>}
   <Text style={s.section}>Replies · {comments.length}</Text>
   {!loading&&comments.length===0&&<View style={s.empty}><Text style={s.emptyTitle}>No replies yet</Text><Text style={s.muted}>Start the conversation.</Text></View>}
   {comments.filter(comment=>!comment.parent_id).map(comment=>{const a=Array.isArray(comment.profiles)?comment.profiles[0]:comment.profiles;const n=a?.display_name||a?.username||'Freetopia member';const key='comment:'+comment.id;const replies=comments.filter(reply=>reply.parent_id===comment.id);const canCommentReport=!!user&&a?.id!==user.id&&!reportedTargets.includes(key);return <View key={comment.id} style={s.comment}>{a?.avatar_url?<Image source={{uri:getImageUrl(a.avatar_url,{width:800,height:800,quality:100})}} style={s.commentAvatar}/>:<View style={s.commentAvatar}><Text style={s.avatarText}>{n.charAt(0).toUpperCase()}</Text></View>}<View style={{flex:1}}><View style={s.commentTop}><Text style={s.commentAuthor}>{n}</Text>{canCommentReport&&<Pressable onPress={()=>openReport({comment_id:comment.id,post_id:post.id,reported_user_id:a?.id||null})}><Text style={s.commentReport}>Report</Text></Pressable>}{reportedTargets.includes(key)&&<Text style={s.commentReported}>Reported</Text>}</View><Text style={s.commentText}>{comment.content}</Text><View style={s.commentMeta}><Text style={s.time}>{new Date(comment.created_at).toLocaleString()}</Text><Pressable onPress={()=>toggleCommentReaction(comment.id)}><Text style={[s.replyLink,(commentReactions[comment.id]||[]).some(x=>x.user_id===user?.id)&&s.reactionActive]}>♥ {(commentReactions[comment.id]||[]).length||''}</Text></Pressable><Pressable onPress={()=>setReplyTo({id:comment.id,name:n})}><Text style={s.replyLink}>Reply</Text></Pressable></View>{replies.map(reply=>{const ra=Array.isArray(reply.profiles)?reply.profiles[0]:reply.profiles;const rn=ra?.display_name||ra?.username||'Freetopia member';return <View key={reply.id} style={s.reply}><View style={s.replyAvatar}><Text style={s.avatarText}>{rn.charAt(0).toUpperCase()}</Text></View><View style={{flex:1}}><Text style={s.commentAuthor}>{rn}</Text><Text style={s.commentText}>{reply.content}</Text><Text style={s.time}>{new Date(reply.created_at).toLocaleString()}</Text></View></View>})}</View></View>})}
  </ScrollView>
  <View style={s.composer}>{replyTo&&<View style={s.replyBanner}><Text style={s.replyBannerText}>Replying to {replyTo.name}</Text><Pressable onPress={()=>setReplyTo(null)}><Text style={s.replyCancel}>Cancel</Text></Pressable></View>}<View style={s.composerRow}><TextInput value={text} onChangeText={setText} placeholder={replyTo?'Write a reply…':'Write a reply…'} placeholderTextColor="#9a9aa4" style={s.input} multiline maxLength={1000}/><Pressable onPress={addComment} disabled={saving||!text.trim()} style={[s.send,(saving||!text.trim())&&s.sendDisabled]}><Text style={s.sendText}>{saving?'…':'Send'}</Text></Pressable></View></View>
 </KeyboardAvoidingView></SafeAreaView>
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:c.bg},header:{height:58,paddingHorizontal:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:c.line},back:{fontSize:34,color:c.ink,lineHeight:34},headerTitle:{fontSize:15,fontWeight:'750',color:c.ink},
 content:{padding:20,paddingBottom:30},muted:{fontSize:12,color:c.muted},error:{padding:12,borderRadius:12,backgroundColor:'#180F15',marginBottom:12},errorText:{fontSize:12,color:c.danger},
 post:{paddingBottom:20,borderBottomWidth:1,borderBottomColor:c.line},photoGallery:{marginTop:12,flexDirection:'row',flexWrap:'wrap',gap:5,borderRadius:12,overflow:'hidden'},photoSingle:{aspectRatio:1},photoSingleItem:{width:'100%',aspectRatio:1,backgroundColor:'#02060B',position:'relative',overflow:'hidden'},photoMultiItem:{width:'49.2%',aspectRatio:1,backgroundColor:'#02060B',position:'relative',overflow:'hidden'},photoImage:{width:'100%',height:'100%'},photoIndex:{position:'absolute',right:7,top:7,paddingHorizontal:7,paddingVertical:4,borderRadius:8,backgroundColor:'#08111B'},photoIndexText:{color:c.ink,fontSize:8,fontWeight:'800'},videoWrap:{marginTop:12,width:'100%',aspectRatio:16/9,borderRadius:12,overflow:'hidden',backgroundColor:'#02060B'},video:{width:'100%',height:'100%'},videoPoster:{position:'absolute',top:0,left:0,right:0,bottom:0,width:'100%',height:'100%'},videoStatus:{marginTop:12,width:'100%',aspectRatio:16/9,borderRadius:12,backgroundColor:'#08111B',borderWidth:1,borderColor:c.line,alignItems:'center',justifyContent:'center',padding:20},videoStatusTitle:{color:c.ink,fontSize:12,fontWeight:'750'},videoStatusText:{color:c.muted,fontSize:10,textAlign:'center',marginTop:5,lineHeight:15},postTop:{flexDirection:'row',alignItems:'flex-start'},authorWrap:{flex:1,flexDirection:'row',gap:10,alignItems:'center'},authorAvatar:{width:42,height:42,borderRadius:21},authorFallback:{width:42,height:42,borderRadius:21,backgroundColor:c.ink,alignItems:'center',justifyContent:'center'},author:{fontSize:14,fontWeight:'750',color:c.ink},handle:{marginTop:2,fontSize:10,color:c.muted},reportButton:{padding:5},reportLink:{fontSize:11,fontWeight:'750',color:c.danger},reported:{fontSize:11,fontWeight:'750',color:'#7F8D9D'},
 community:{marginTop:4,fontSize:10,fontWeight:'700',color:'#8D82B8'},contentText:{marginTop:10,fontSize:16,lineHeight:24,color:c.ink},time:{marginTop:7,fontSize:10,color:'#68798C'},postActions:{flexDirection:'row',gap:20,marginTop:14,paddingTop:11,borderTopWidth:1,borderTopColor:c.line},postAction:{flexDirection:'row',alignItems:'center',gap:6},postActionIcon:{fontSize:16,color:c.muted},liked:{color:'#8E5A6B'},postActionText:{fontSize:10,fontWeight:'700',color:c.muted},reportBox:{marginTop:14,padding:14,borderWidth:1,borderColor:c.line,borderRadius:15,backgroundColor:'#0A121C'},reportTitle:{fontSize:14,fontWeight:'750',color:c.ink},reportLead:{marginTop:4,fontSize:11,lineHeight:16,color:c.muted},reasonList:{marginTop:10},reason:{paddingVertical:9,paddingHorizontal:10,borderWidth:1,borderColor:c.line,borderRadius:9,marginBottom:6,backgroundColor:'#0E1824'},reasonSelected:{borderColor:c.accent,backgroundColor:'#182536'},reasonText:{fontSize:11,color:c.ink},reasonTextSelected:{fontWeight:'750',color:c.accent},details:{minHeight:70,maxHeight:100,borderWidth:1,borderColor:c.line,borderRadius:10,padding:10,fontSize:11,color:c.ink,backgroundColor:'#0A121C'},reportActions:{marginTop:10,flexDirection:'row',justifyContent:'flex-end',gap:8},cancel:{height:38,paddingHorizontal:13,justifyContent:'center'},cancelText:{fontSize:11,fontWeight:'700',color:c.muted},submit:{height:38,paddingHorizontal:14,borderRadius:10,backgroundColor:c.ink,justifyContent:'center'},submitDisabled:{opacity:.35},submitText:{fontSize:11,fontWeight:'750',color:'#F4F6F8'},
 section:{marginTop:22,fontSize:15,fontWeight:'750',color:c.ink},empty:{marginTop:12,padding:18,borderWidth:1,borderColor:c.line,borderRadius:14,alignItems:'center'},emptyTitle:{fontSize:14,fontWeight:'700',color:c.ink,marginBottom:5},
 comment:{flexDirection:'row',gap:10,paddingVertical:14,borderBottomWidth:1,borderBottomColor:c.line},commentTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},commentReport:{fontSize:10,fontWeight:'750',color:c.danger},commentReported:{fontSize:10,fontWeight:'750',color:c.muted,marginLeft:8},commentAvatar:{width:34,height:34,borderRadius:17,backgroundColor:c.ink,alignItems:'center',justifyContent:'center'},avatarText:{color:'#fff',fontWeight:'750'},commentAuthor:{fontSize:12,fontWeight:'750',color:c.ink},commentText:{marginTop:4,fontSize:13,lineHeight:20,color:c.ink},reactionActive:{color:c.accent},commentMeta:{flexDirection:'row',alignItems:'center',gap:12,marginTop:3},replyLink:{fontSize:10,fontWeight:'750',color:c.accent},reply:{marginTop:10,paddingTop:10,borderTopWidth:1,borderTopColor:'#101C29',flexDirection:'row',gap:8},replyAvatar:{width:27,height:27,borderRadius:14,backgroundColor:'#26384D',alignItems:'center',justifyContent:'center'},
 composer:{padding:12,borderTopWidth:1,borderTopColor:c.line,backgroundColor:'#0A121C'},composerRow:{flexDirection:'row',alignItems:'flex-end',gap:8},replyBanner:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:4,paddingBottom:7},replyBannerText:{fontSize:10,color:c.muted},replyCancel:{fontSize:10,fontWeight:'750',color:c.accent},input:{flex:1,minHeight:42,maxHeight:100,borderWidth:1,borderColor:c.line,borderRadius:14,paddingHorizontal:13,paddingVertical:10,fontSize:13,color:c.ink},send:{height:42,paddingHorizontal:15,borderRadius:14,backgroundColor:c.accent,alignItems:'center',justifyContent:'center'},sendDisabled:{opacity:.35},sendText:{color:'#fff',fontSize:12,fontWeight:'750'}
});
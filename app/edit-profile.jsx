import { useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';

const C={bg:'#050A11',panel:'#08121E',panel2:'#0C1928',line:'#17283B',text:'#F5F7FA',muted:'#8191A5',blue:'#3B82F6',violet:'#7C3AED',pink:'#D946EF',green:'#22C55E'};

export default function EditProfile(){
  const router=useRouter();
  const {user,profile,refreshProfile}=useAuth();
  const {width}=useWindowDimensions();
  const desktop=Platform.OS==='web'&&width>=1000;
  const [username,setUsername]=useState('');
  const [name,setName]=useState('');
  const [bio,setBio]=useState('');
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{setUsername(profile?.username||'');setName(profile?.display_name||'');setBio(profile?.bio||'');},[profile]);

  const save=async()=>{
    if(!user||saving)return;
    setSaving(true);setError('');
    const {error:e}=await supabase.from('profiles').update({
      username:username.trim()||null,
      display_name:name.trim()||null,
      bio:bio.trim()||null
    }).eq('id',user.id);
    if(e){setError(e.message);setSaving(false);return;}
    await refreshProfile();setSaving(false);router.back();
  };

  const avatar=profile?.avatar_url;
  const initial=(name||profile?.username||user?.email||'?').charAt(0).toUpperCase();
  const completion=useMemo(()=>[!!avatar,!!bio.trim(),!!username.trim(),!!name.trim()].filter(Boolean).length*25,[avatar,bio,username,name]);

  return <SafeAreaView style={s.safe}>
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
      {desktop?<Desktop router={router} profile={profile} avatar={avatar} initial={initial} username={username} name={name} bio={bio} setUsername={setUsername} setName={setName} setBio={setBio} save={save} saving={saving} error={error} completion={completion}/>:<Mobile router={router} profile={profile} avatar={avatar} initial={initial} username={username} name={name} bio={bio} setUsername={setUsername} setName={setName} setBio={setBio} save={save} saving={saving} error={error}/>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function Desktop(p){
 return <View style={s.desktopShell}>
   <Sidebar router={p.router}/>
   <View style={s.desktopMain}>
     <Topbar router={p.router}/>
     <View style={s.desktopBody}>
       <View style={s.editor}>
         <View style={s.editorHeader}><View style={s.headingRow}><Pressable onPress={()=>p.router.back()}><Text style={s.back}>‹</Text></Pressable><Text style={s.pageTitle}>Edit Profile</Text></View><Pressable onPress={p.save} disabled={p.saving} style={s.saveButton}><Text style={s.saveText}>{p.saving?'Saving…':'Save Changes'}</Text></Pressable></View>
         <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.editorScroll}>
           <Cover avatar={p.avatar} initial={p.initial}/>
           <View style={s.photoActions}><Pressable style={s.outlineButton}><Text style={s.buttonText}>◎ Change Profile Photo</Text></Pressable><Text style={s.photoNote}>Photo uploads will be connected through Freetopia Storage.</Text></View>
           <View style={s.fields2}>
             <Field label="Username" value={p.username} setValue={p.setUsername} max={30}/>
             <Field label="Display Name" value={p.name} setValue={p.setName} max={50}/>
           </View>
           <Field label="Bio" value={p.bio} setValue={p.setBio} max={150} multiline/>
           {!!p.error&&<Error text={p.error}/>}
           <View style={s.section}><Text style={s.sectionTitle}>Interests</Text><Text style={s.sectionHint}>Personalize your discovery experience later.</Text><View style={s.chips}>{['Tech','Business','Fitness','Faith','Travel','Content Creation'].map(x=><View key={x} style={s.chip}><Text style={s.chipText}>{x}</Text><Text style={s.chipX}>×</Text></View>)}</View></View>
           <View style={s.section}><Text style={s.sectionTitle}>Social Links</Text><LinkRow icon="◎" label="Instagram" value="Add link"/><LinkRow icon="𝕏" label="X (Twitter)" value="Add link"/><LinkRow icon="▶" label="YouTube" value="Add link"/></View>
         </ScrollView>
       </View>
       <View style={s.rightRail}>
         <Card title="Profile Preview"><View style={s.previewCover}/><Avatar avatar={p.avatar} initial={p.initial} size={68}/><Text style={s.previewName}>{p.name||'Your name'}</Text><Text style={s.previewHandle}>@{p.username||'username'}</Text><Text style={s.previewBio}>{p.bio||'Add a short bio to introduce yourself.'}</Text><View style={s.previewMeta}><Text style={s.metaText}>⌖ Location</Text><Text style={s.metaText}>◷ Joined Freetopia</Text></View><View style={s.stats}><Stat label="Following" value="—"/><Stat label="Followers" value="—"/></View></Card>
         <Card title="Profile Tips"><Tip done={!!p.avatar} text="Add a clear profile photo"/><Tip done={!!p.bio.trim()} text="Write a short bio"/><Tip done={false} text="Add your location"/><Tip done={false} text="Add social links"/><Text style={s.tipBody}>A complete profile helps people understand who you are and what you care about.</Text></Card>
         <Card title="Profile Visibility"><Pressable style={s.settingRow}><Text style={s.settingIcon}>◉</Text><View style={{flex:1}}><Text style={s.settingTitle}>Public</Text><Text style={s.settingSub}>Anyone can see your profile and public posts.</Text></View><Text style={s.chevron}>›</Text></Pressable></Card>
         <Card title="Quick Actions"><Pressable onPress={()=>p.router.push('/settings')} style={s.settingRow}><Text style={s.settingIcon}>⚙</Text><Text style={s.settingTitle}>Settings & Privacy</Text><Text style={s.chevron}>›</Text></Pressable><Pressable onPress={()=>p.router.push('/settings')} style={s.settingRow}><Text style={s.settingIcon}>?</Text><Text style={s.settingTitle}>Account & security</Text><Text style={s.chevron}>›</Text></Pressable></Card>
       </View>
     </View>
   </View>
 </View>;
}

function Mobile(p){
 return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.mobileContent}>
   <View style={s.mobileHeader}><Pressable onPress={()=>p.router.back()}><Text style={s.mobileBack}>‹</Text></Pressable><Text style={s.mobileTitle}>Edit Profile</Text><Pressable onPress={p.save} disabled={p.saving}><Text style={[s.check,p.saving&&{opacity:.4}]}>✓</Text></Pressable></View>
   <Cover avatar={p.avatar} initial={p.initial}/>
   <View style={s.mobilePhoto}><Pressable style={s.camera}><Text style={s.cameraText}>◎</Text></Pressable></View>
   <View style={s.mobileFields}><Field label="Username" value={p.username} setValue={p.setUsername} max={30}/><Field label="Display Name" value={p.name} setValue={p.setName} max={50}/><Field label="Bio" value={p.bio} setValue={p.setBio} max={150} multiline/></View>
   {!!p.error&&<Error text={p.error}/>}
   <View style={s.section}><View style={s.sectionHead}><Text style={s.sectionTitle}>Location</Text></View><View style={s.fakeField}><Text style={s.fakeIcon}>⌖</Text><Text style={s.fakeText}>Add your location</Text></View><Text style={s.sectionHint}>Location fields will be stored when profile location support is added.</Text></View>
   <View style={s.section}><View style={s.sectionHead}><Text style={s.sectionTitle}>Interests</Text><Text style={s.editLink}>Edit</Text></View><View style={s.chips}>{['Tech','Business','Fitness','Faith','Travel','Content Creation'].map(x=><View key={x} style={s.chip}><Text style={s.chipText}>{x}</Text></View>)}</View></View>
   <View style={s.section}><Text style={s.sectionTitle}>Social Links</Text><LinkRow icon="◎" label="Instagram" value="Add link"/><LinkRow icon="𝕏" label="X (Twitter)" value="Add link"/><LinkRow icon="▶" label="YouTube" value="Add link"/></View>
 </ScrollView>;
}

function Cover({avatar,initial}){return <View style={s.cover}><View style={s.coverGlow}/><Text style={s.coverMark}>FREETOPIA</Text><Avatar avatar={avatar} initial={initial} size={88}/><View style={s.coverCamera}><Text style={s.coverCameraText}>◎</Text></View></View>}
function Avatar({avatar,initial,size}){return avatar?<Image source={{uri:avatar}} style={[s.avatar,{width:size,height:size,borderRadius:size/2}]}/>:<View style={[s.avatar,s.avatarFallback,{width:size,height:size,borderRadius:size/2}]}><Text style={[s.avatarInitial,{fontSize:size*.32}]}>{initial}</Text></View>}
function Field({label,value,setValue,max,multiline}){return <View style={s.field}><View style={s.labelRow}><Text style={s.label}>{label}</Text><Text style={s.counter}>{value.length}/{max}</Text></View><TextInput value={value} onChangeText={v=>v.length<=max&&setValue(v)} multiline={multiline} autoCapitalize={label==='Username'?'none':'sentences'} placeholder={label==='Bio'?'Tell people a little about yourself…':''} placeholderTextColor="#607087" style={[s.input,multiline&&s.bioInput]}/></View>}
function LinkRow({icon,label,value}){return <View style={s.linkRow}><Text style={s.linkIcon}>{icon}</Text><View style={{flex:1}}><Text style={s.linkLabel}>{label}</Text><Text style={s.linkValue}>{value}</Text></View><Text style={s.chevron}>›</Text></View>}
function Card({title,children}){return <View style={s.card}><Text style={s.cardTitle}>{title}</Text>{children}</View>}
function Tip({done,text}){return <View style={s.tip}><Text style={[s.tipCheck,{color:done?C.green:C.muted}]}>{done?'✓':'○'}</Text><Text style={s.tipText}>{text}</Text></View>}
function Stat({label,value}){return <View style={s.stat}><Text style={s.statValue}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>}
function Error({text}){return <View style={s.error}><Text style={s.errorTitle}>Couldn't save profile</Text><Text style={s.errorText}>{text}</Text></View>}
function Sidebar({router}){const items=[['⌂','Home','/home'],['⌕','Explore','/explore'],['♧','Communities','/communities'],['▱','Messages','/messages'],['♧','Notifications','/notifications'],['＋','Create','/create'],['♙','Profile','/profile']];return <View style={s.sidebar}><View style={s.brand}><Image source={require('../public/brand/freetopia-mark.png')} style={s.logo}/><Text style={s.brandText}>Freetopia</Text></View><View style={s.sideNav}>{items.map(([i,l,path])=><Pressable key={l} onPress={()=>router.push(path)} style={[s.sideItem,l==='Profile'&&s.active]}><Text style={s.sideIcon}>{i}</Text><Text style={s.sideLabel}>{l}</Text>{l==='Messages'?<Badge n="3"/>:null}{l==='Notifications'?<Badge n="5"/>:null}</Pressable>)}</View></View>}
function Topbar({router}){return <View style={s.topbar}><TextInput placeholder="⌕  Search Freetopia..." placeholderTextColor="#667991" style={s.search}/><View style={s.topIcons}><Text style={s.topIcon}>♧</Text><Text style={s.topIcon}>□</Text><Pressable onPress={()=>router.push('/profile')}><View style={s.topAvatar}><Text style={s.topAvatarText}>F</Text></View></Pressable></View></View>}
function Badge({n}){return <View style={s.badge}><Text style={s.badgeText}>{n}</Text></View>}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},desktopShell:{flex:1,flexDirection:'row',backgroundColor:C.bg},sidebar:{width:205,padding:16,paddingTop:24,borderRightWidth:1,borderRightColor:C.line,backgroundColor:'#060D16'},brand:{flexDirection:'row',alignItems:'center',gap:9},logo:{width:34,height:34},brandText:{color:C.text,fontSize:17,fontWeight:'800'},sideNav:{marginTop:35,gap:4},sideItem:{minHeight:45,paddingHorizontal:11,borderRadius:10,flexDirection:'row',alignItems:'center',gap:12},active:{backgroundColor:'#172B55'},sideIcon:{width:20,color:'#AFC0D3',fontSize:18,textAlign:'center'},sideLabel:{color:'#C9D4E2',fontSize:12,fontWeight:'600',flex:1},badge:{minWidth:18,height:18,borderRadius:9,backgroundColor:C.violet,alignItems:'center',justifyContent:'center'},badgeText:{color:'#fff',fontSize:8,fontWeight:'800'},
 desktopMain:{flex:1},topbar:{height:62,borderBottomWidth:1,borderBottomColor:C.line,flexDirection:'row',alignItems:'center',paddingHorizontal:18},search:{height:36,width:500,maxWidth:'60%',backgroundColor:'#101D30',borderRadius:9,paddingHorizontal:12,color:C.text,fontSize:11,borderWidth:1,borderColor:'#172D46'},topIcons:{marginLeft:'auto',flexDirection:'row',alignItems:'center',gap:18},topIcon:{color:C.text,fontSize:19},topAvatar:{width:30,height:30,borderRadius:15,backgroundColor:'#31445B',alignItems:'center',justifyContent:'center'},topAvatarText:{color:C.text,fontSize:11,fontWeight:'800'},desktopBody:{flex:1,flexDirection:'row',padding:12,gap:12},editor:{flex:1,borderWidth:1,borderColor:C.line,borderRadius:12,backgroundColor:C.panel,overflow:'hidden'},editorHeader:{height:58,paddingHorizontal:13,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:C.line},headingRow:{flexDirection:'row',alignItems:'center',gap:10},back:{fontSize:31,color:C.text,lineHeight:31},pageTitle:{fontSize:20,fontWeight:'800',color:C.text},saveButton:{height:31,paddingHorizontal:14,borderRadius:8,backgroundColor:C.blue,alignItems:'center',justifyContent:'center'},saveText:{color:'#fff',fontSize:9,fontWeight:'800'},editorScroll:{padding:12,paddingBottom:40},cover:{height:130,borderRadius:10,backgroundColor:'#101E34',borderWidth:1,borderColor:'#243C59',position:'relative',overflow:'visible',alignItems:'flex-start',justifyContent:'flex-end',padding:10},coverGlow:{position:'absolute',top:0,right:0,bottom:0,left:0,backgroundColor:'#172A4B',opacity:.65},coverMark:{position:'absolute',right:15,top:17,color:'#6D86A5',fontSize:8,fontWeight:'900',letterSpacing:3},avatar:{borderWidth:2,borderColor:'#DCE7F4',backgroundColor:'#1A2A3C'},avatarFallback:{alignItems:'center',justifyContent:'center'},avatarInitial:{color:'#fff',fontWeight:'800'},coverCamera:{position:'absolute',left:86,bottom:-2,width:28,height:28,borderRadius:14,backgroundColor:'#0B1521',borderWidth:1,borderColor:'#AFC0D3',alignItems:'center',justifyContent:'center'},coverCameraText:{color:'#fff',fontSize:13},photoActions:{marginTop:15,flexDirection:'row',alignItems:'center',gap:10},outlineButton:{height:32,paddingHorizontal:11,borderRadius:16,borderWidth:1,borderColor:'#29435E',justifyContent:'center'},buttonText:{color:'#C9D8E8',fontSize:9,fontWeight:'700'},photoNote:{color:'#667991',fontSize:8,flex:1},fields2:{flexDirection:'row',gap:12},field:{flex:1,marginTop:13},labelRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:6},label:{color:'#C8D5E4',fontSize:10,fontWeight:'700'},counter:{color:'#65778E',fontSize:8},input:{height:42,borderWidth:1,borderColor:'#223A54',borderRadius:8,backgroundColor:'#091726',paddingHorizontal:11,color:C.text,fontSize:11},bioInput:{height:84,paddingTop:10,textAlignVertical:'top'},section:{marginTop:13,borderTopWidth:1,borderTopColor:C.line,paddingTop:13},sectionHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},sectionTitle:{color:C.text,fontSize:13,fontWeight:'800'},sectionHint:{color:C.muted,fontSize:8,marginTop:5},editLink:{color:'#5CA2FF',fontSize:9,fontWeight:'800'},chips:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:10},chip:{height:28,paddingHorizontal:10,borderRadius:14,backgroundColor:'#11243B',borderWidth:1,borderColor:'#233D5A',flexDirection:'row',alignItems:'center',gap:6},chipText:{color:'#C8D8E9',fontSize:9},chipX:{color:'#7D90A6',fontSize:12},linkRow:{height:52,borderBottomWidth:1,borderBottomColor:C.line,flexDirection:'row',alignItems:'center',gap:10},linkIcon:{width:26,height:26,borderRadius:7,backgroundColor:'#14263C',color:'#E7EEF7',fontSize:15,textAlign:'center',textAlignVertical:'center'},linkLabel:{color:C.text,fontSize:10,fontWeight:'700'},linkValue:{color:C.muted,fontSize:8,marginTop:3},chevron:{color:'#7890A9',fontSize:22},rightRail:{width:300,gap:12},card:{borderWidth:1,borderColor:C.line,borderRadius:11,backgroundColor:C.panel,padding:12},cardTitle:{color:C.text,fontSize:12,fontWeight:'800',marginBottom:10},previewCover:{height:78,borderRadius:8,backgroundColor:'#172A4B',marginBottom:-28},previewName:{color:C.text,fontSize:15,fontWeight:'800',marginTop:8},previewHandle:{color:'#7590AC',fontSize:9,marginTop:2},previewBio:{color:'#B7C5D5',fontSize:9,lineHeight:14,marginTop:8},previewMeta:{flexDirection:'row',gap:10,marginTop:8,flexWrap:'wrap'},metaText:{color:'#8EA0B3',fontSize:8},stats:{flexDirection:'row',gap:30,marginTop:10},statValue:{color:C.text,fontSize:11,fontWeight:'800'},statLabel:{color:C.muted,fontSize:8,marginTop:2},tip:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:9},tipCheck:{fontSize:15},tipText:{color:'#B8C6D5',fontSize:9},tipBody:{color:C.muted,fontSize:8,lineHeight:13,marginTop:4},settingRow:{minHeight:46,flexDirection:'row',alignItems:'center',gap:9,borderBottomWidth:1,borderBottomColor:C.line},settingIcon:{width:23,color:'#AFC0D3',fontSize:15,textAlign:'center'},settingTitle:{color:C.text,fontSize:10,fontWeight:'700'},settingSub:{color:C.muted,fontSize:8,marginTop:3},error:{marginTop:12,padding:10,borderRadius:8,borderWidth:1,borderColor:'#5B2936',backgroundColor:'#1D0D14'},errorTitle:{color:'#FF9CAE',fontSize:9,fontWeight:'800'},errorText:{color:'#C98995',fontSize:8,marginTop:3},
 mobileContent:{paddingBottom:90,backgroundColor:C.bg},mobileHeader:{height:60,paddingHorizontal:17,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:C.line},mobileBack:{fontSize:32,color:C.text},mobileTitle:{color:C.text,fontSize:19,fontWeight:'800'},check:{color:C.text,fontSize:25},mobilePhoto:{height:0,position:'relative'},camera:{position:'absolute',top:-34,left:100,width:34,height:34,borderRadius:17,backgroundColor:'#0B1521',borderWidth:1,borderColor:'#DCE7F4',alignItems:'center',justifyContent:'center'},cameraText:{color:'#fff',fontSize:15},mobileFields:{paddingHorizontal:17,marginTop:38},fakeField:{height:48,borderBottomWidth:1,borderBottomColor:C.line,flexDirection:'row',alignItems:'center',gap:10,marginTop:6},fakeIcon:{color:'#BFD0E1',fontSize:18},fakeText:{color:'#B5C3D2',fontSize:11},mobileFieldsContent:{paddingHorizontal:17}
});
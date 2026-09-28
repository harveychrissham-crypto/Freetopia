import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import AppIcon from './AppIcon';

const C={panel:'#0A121C',line:'#182533',text:'#E9EEF4',muted:'#7F8D9D',blue:'#4B78A8'};

export function LoadingState({label='Loading…',rows=3}) {
  return <View style={s.wrap}>
    {Array.from({length:rows}).map((_,i)=><View key={i} style={s.skeletonRow}>
      <View style={[s.skeleton,s.avatar,{opacity:i===0?.72:.48}]}/>
      <View style={s.skeletonCopy}><View style={[s.skeleton,{width:i===0?'72%':'58%',height:10}]}/><View style={[s.skeleton,{width:i===0?'92%':'78%',height:8,marginTop:8}]}/></View>
    </View>)}
    <View style={s.loadingLabel}><ActivityIndicator size="small" color={C.blue}/><Text style={s.loadingText}>{label}</Text></View>
  </View>;
}

export function EmptyState({icon='inbox',title,body,action,onPress}) {
  return <View style={s.empty}>
    <View style={s.icon}><AppIcon name={icon} size={20} color={C.blue}/></View>
    <Text style={s.title}>{title}</Text>
    {body?<Text style={s.body}>{body}</Text>:null}
    {action&&onPress?<Pressable onPress={onPress} style={({pressed})=>[s.action,pressed&&s.pressed]}><Text style={s.actionText}>{action}</Text></Pressable>:null}
  </View>;
}

const s=StyleSheet.create({
 wrap:{marginTop:10,borderWidth:1,borderColor:C.line,borderRadius:13,backgroundColor:C.panel,padding:12},
 skeletonRow:{minHeight:58,flexDirection:'row',alignItems:'center',gap:11,borderBottomWidth:1,borderBottomColor:'#101D2A'},
 skeleton:{backgroundColor:'#182636',borderRadius:7},
 avatar:{width:38,height:38,borderRadius:19},
 skeletonCopy:{flex:1},
 loadingLabel:{height:34,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},
 loadingText:{fontSize:10,fontWeight:'650',color:C.muted},
 empty:{marginTop:10,padding:28,alignItems:'center',borderWidth:1,borderColor:C.line,borderRadius:13,backgroundColor:C.panel},
 icon:{width:42,height:42,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:'#102236',borderWidth:1,borderColor:'#1B334D'},
 title:{marginTop:12,fontSize:15,fontWeight:'800',color:C.text,textAlign:'center'},
 body:{marginTop:7,maxWidth:430,fontSize:11,lineHeight:17,color:C.muted,textAlign:'center'},
 action:{marginTop:14,minHeight:36,paddingHorizontal:14,borderRadius:9,alignItems:'center',justifyContent:'center',backgroundColor:'#304B68',borderWidth:1,borderColor:'#3A5876'},
 actionText:{fontSize:10,fontWeight:'800',color:'#F4F6F8'},
 pressed:{opacity:.72,transform:[{scale:.98}]}
});
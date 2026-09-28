import { StyleSheet, View } from 'react-native';

export default function AppIcon({ name, size = 20, color = '#E9EEF4' }) {
  const stroke = Math.max(1.6, size * 0.09);
  const common = { position: 'absolute', backgroundColor: color };
  const scale = size / 20;

  if (name === 'check') return <View style={[s.box,{width:size,height:size}]}><View style={{position:'absolute',width:size*.42,height:size*.18,borderLeftWidth:stroke,borderBottomWidth:stroke,borderColor:color,transform:[{rotate:'-45deg'}],left:size*.28,top:size*.34}} /></View>;

  if (name === 'arrow-left') return <View style={[s.box,{width:size,height:size}]}><View style={{position:'absolute',width:size*.55,height:stroke,backgroundColor:color,left:size*.25,top:size*.46}}/><View style={{position:'absolute',width:size*.34,height:size*.34,borderLeftWidth:stroke,borderBottomWidth:stroke,borderColor:color,transform:[{rotate:'45deg'}],left:size*.2,top:size*.29}}/></View>;

  if (name === 'chevron-right') return <View style={[s.box,{width:size,height:size}]}><View style={{position:'absolute',width:size*.34,height:size*.34,borderRightWidth:stroke,borderTopWidth:stroke,borderColor:color,transform:[{rotate:'45deg'}],left:size*.22,top:size*.32}}/></View>;

  if (name === 'location') return <View style={[s.box,{width:size,height:size}]}><View style={{position:'absolute',width:size*.55,height:size*.55,borderWidth:stroke,borderColor:color,borderRadius:size*.4,left:size*.225,top:size*.12}}/><View style={{position:'absolute',width:size*.18,height:size*.18,borderRadius:size,backgroundColor:color,left:size*.41,top:size*.305}}/></View>;

  if (name === 'clock') return <View style={[s.box,{width:size,height:size}]}><View style={{position:'absolute',width:size*.72,height:size*.72,borderWidth:stroke,borderColor:color,borderRadius:size,left:size*.14,top:size*.14}}/><View style={{position:'absolute',width:stroke,height:size*.25,backgroundColor:color,left:size*.48,top:size*.27}}/><View style={{position:'absolute',width:size*.2,height:stroke,backgroundColor:color,left:size*.48,top:size*.49}}/></View>;

  if (name === 'settings') return <View style={[s.box,{width:size,height:size}]}><View style={{position:'absolute',width:size*.55,height:size*.55,borderWidth:stroke,borderColor:color,borderRadius:size,left:size*.225,top:size*.225}}/><View style={{position:'absolute',width:size*.22,height:size*.22,borderWidth:stroke,borderColor:color,borderRadius:size,left:size*.39,top:size*.39}}/></View>;

  if (name === 'info') return <View style={[s.box,{width:size,height:size}]}><View style={{position:'absolute',width:size*.72,height:size*.72,borderWidth:stroke,borderColor:color,borderRadius:size,left:size*.14,top:size*.14}}/><View style={{position:'absolute',width:stroke,height:size*.28,backgroundColor:color,left:size*.48,top:size*.38}}/><View style={{position:'absolute',width:size*.08,height:size*.08,borderRadius:size,backgroundColor:color,left:size*.46,top:size*.25}}/></View>;

  if (name === 'globe') return <View style={[s.box,{width:size,height:size}]}><View style={{position:'absolute',width:size*.72,height:size*.72,borderWidth:stroke,borderColor:color,borderRadius:size,left:size*.14,top:size*.14}}/><View style={{position:'absolute',width:size*.72,height:stroke,backgroundColor:color,left:size*.14,top:size*.48}}/><View style={{position:'absolute',width:size*.22,height:size*.72,borderLeftWidth:stroke,borderRightWidth:stroke,borderColor:color,left:size*.39,top:size*.14,borderRadius:size}}/></View>;

  if (name === 'search') return (
    <View style={[s.box, { width: size, height: size }]}>
      <View style={[s.searchCircle, { width: size * .55, height: size * .55, borderRadius: size, borderWidth: stroke, borderColor: color, left: size * .16, top: size * .12 }]} />
      <View style={[common, { width: size * .34, height: stroke, borderRadius: stroke, left: size * .58, top: size * .68, transform: [{ rotate: '45deg' }] }]} />
    </View>
  );

  if (name === 'bell') return (
    <View style={[s.box, { width: size, height: size }]}>
      <View style={{ position:'absolute', width:size*.56, height:size*.62, left:size*.22, top:size*.12, borderWidth:stroke, borderColor:color, borderRadius:size*.28 }} />
      <View style={[common,{width:size*.72,height:stroke,borderRadius:stroke,left:size*.14,top:size*.72}]} />
      <View style={[common,{width:size*.18,height:size*.09,borderRadius:size*.08,left:size*.41,top:size*.79}]} />
    </View>
  );

  if (name === 'message') return (
    <View style={[s.box, { width: size, height: size }]}>
      <View style={{ position:'absolute', width:size*.72, height:size*.55, left:size*.1, top:size*.15, borderWidth:stroke, borderColor:color, borderRadius:size*.14 }} />
      <View style={[common,{width:size*.22,height:stroke,left:size*.18,top:size*.68,transform:[{rotate:'-35deg'}]}]} />
      <View style={[common,{width:size*.28,height:stroke,left:size*.25,top:size*.42,borderRadius:stroke}]} />
      <View style={[common,{width:size*.18,height:stroke,left:size*.25,top:size*.54,borderRadius:stroke}]} />
    </View>
  );

  if (name === 'home') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.54,height:size*.54,left:size*.23,top:size*.28,borderWidth:stroke,borderColor:color,borderTopWidth:0,borderRadius:size*.04}} />
      <View style={{position:'absolute',width:size*.53,height:size*.53,left:size*.235,top:size*.02,borderLeftWidth:stroke,borderTopWidth:stroke,borderColor:color,transform:[{rotate:'45deg'}],borderRadius:size*.04}} />
      <View style={[common,{width:size*.16,height:size*.29,left:size*.42,top:size*.51,borderRadius:size*.03}]} />
    </View>
  );

  if (name === 'compass') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.76,height:size*.76,left:size*.12,top:size*.12,borderWidth:stroke,borderColor:color,borderRadius:size}} />
      <View style={{position:'absolute',width:size*.18,height:size*.48,left:size*.41,top:size*.26,backgroundColor:color,transform:[{rotate:'42deg'}],borderRadius:size*.04}} />
      <View style={{position:'absolute',width:size*.18,height:size*.18,left:size*.41,top:size*.41,borderRadius:size,backgroundColor:'#060B12'}} />
    </View>
  );

  if (name === 'users') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.25,height:size*.25,left:size*.22,top:size*.12,borderWidth:stroke,borderColor:color,borderRadius:size}} />
      <View style={{position:'absolute',width:size*.25,height:size*.25,left:size*.53,top:size*.12,borderWidth:stroke,borderColor:color,borderRadius:size}} />
      <View style={{position:'absolute',width:size*.48,height:size*.27,left:size*.08,top:size*.55,borderWidth:stroke,borderColor:color,borderRadius:size*.25}} />
      <View style={{position:'absolute',width:size*.38,height:size*.23,left:size*.5,top:size*.58,borderWidth:stroke,borderColor:color,borderRadius:size*.25}} />
    </View>
  );

  if (name === 'profile') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.31,height:size*.31,left:size*.345,top:size*.1,borderWidth:stroke,borderColor:color,borderRadius:size}} />
      <View style={{position:'absolute',width:size*.68,height:size*.35,left:size*.16,top:size*.55,borderWidth:stroke,borderColor:color,borderRadius:size*.35}} />
    </View>
  );

  if (name === 'plus') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={[common,{width:size*.72,height:stroke,left:size*.14,top:size*.46,borderRadius:stroke}]} />
      <View style={[common,{width:stroke,height:size*.72,left:size*.46,top:size*.14,borderRadius:stroke}]} />
    </View>
  );

  if (name === 'comment') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.72,height:size*.56,left:size*.12,top:size*.12,borderWidth:stroke,borderColor:color,borderRadius:size*.14}} />
      <View style={{position:'absolute',width:size*.22,height:stroke,left:size*.18,top:size*.67,backgroundColor:color,transform:[{rotate:'-35deg'}]}} />
    </View>
  );

  if (name === 'share') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.68,height:size*.68,left:size*.12,top:size*.2,borderLeftWidth:stroke,borderBottomWidth:stroke,borderColor:color,borderRadius:size*.06,transform:[{rotate:'-45deg'}]}} />
      <View style={{position:'absolute',width:size*.62,height:stroke,left:size*.18,top:size*.47,backgroundColor:color}} />
      <View style={{position:'absolute',width:size*.34,height:size*.34,left:size*.51,top:size*.14,borderTopWidth:stroke,borderRightWidth:stroke,borderColor:color,transform:[{rotate:'45deg'}]}} />
    </View>
  );

  if (name === 'more') return (
    <View style={[s.box,{width:size,height:size,flexDirection:'row',gap:size*.12}]}>
      {[0,1,2].map(i=><View key={i} style={{width:size*.12,height:size*.12,borderRadius:size,backgroundColor:color}} />)}
    </View>
  );

  if (name === 'spark') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.16,height:size*.8,left:size*.42,top:size*.1,backgroundColor:color,transform:[{rotate:'45deg'}],borderRadius:size}} />
      <View style={{position:'absolute',width:size*.8,height:size*.16,left:size*.1,top:size*.42,backgroundColor:color,transform:[{rotate:'45deg'}],borderRadius:size}} />
    </View>
  );

  if (name === 'photo') return (
    <View style={[s.box,{width:size,height:size,borderWidth:stroke,borderColor:color,borderRadius:size*.12}]}>
      <View style={{position:'absolute',width:size*.18,height:size*.18,borderRadius:size,backgroundColor:color,left:size*.18,top:size*.18}} />
      <View style={{position:'absolute',width:size*.5,height:size*.28,borderTopWidth:stroke,borderLeftWidth:stroke,borderColor:color,left:size*.25,top:size*.43,transform:[{rotate:'-25deg'}]}} />
    </View>
  );

  if (name === 'video') return (
    <View style={[s.box,{width:size,height:size,borderWidth:stroke,borderColor:color,borderRadius:size*.12}]}>
      <View style={{position:'absolute',left:size*.38,top:size*.28,width:0,height:0,borderTopWidth:size*.2,borderBottomWidth:size*.2,borderLeftWidth:size*.28,borderTopColor:'transparent',borderBottomColor:'transparent',borderLeftColor:color}} />
    </View>
  );

  if (name === 'poll') return (
    <View style={[s.box,{width:size,height:size,flexDirection:'row',alignItems:'flex-end',justifyContent:'center',gap:size*.1}]}>
      <View style={{width:size*.14,height:size*.35,backgroundColor:color,borderRadius:2}} />
      <View style={{width:size*.14,height:size*.55,backgroundColor:color,borderRadius:2}} />
      <View style={{width:size*.14,height:size*.75,backgroundColor:color,borderRadius:2}} />
    </View>
  );

  if (name === 'dots') return (
    <View style={[s.box,{width:size,height:size,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:size*.1}]}>
      {[0,1,2].map(i=><View key={i} style={{width:size*.12,height:size*.12,borderRadius:size,backgroundColor:color}} />)}
    </View>
  );

  return <View style={{ width:size, height:size }} />;
}

const s = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  searchCircle: { position:'absolute' },
});

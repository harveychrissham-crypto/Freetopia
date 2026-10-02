import { Image, StyleSheet, View } from 'react-native';


export default function AppIcon({ name, size = 20, color = '#E9EEF4' }) {
  const stroke = Math.max(1.25, size * 0.075);
  const common = { position: 'absolute', backgroundColor: color };
  const scale = size / 20; // icon scale baseline

  if (name === 'like') return <Image source={{uri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAABY0lEQVR4Aa3BPW+NARgG4Os97/O8SDoYDL4XXSQkYjJ2093qTzQmYTgnYbKU1B8Qg59hkm7UGSQYxLexiRjPrUMHMYrr8q8GB3Ju4wp5oFcbJt9Vnjq2uq8x5o5a3dQ5YVo9tzbdHp69eDXkzMa6IS911vSKKXTovNehs65Dh2lF+6lzucxyz5g1HTpUqFBZV6FChw4VKms692bGXNehQqFChQodOlSoUKgw5sZM5bgKFSpU6NChQoUKFSp06BydqeypUKFDo0KFChUqVOhQKHszR4a7OnSoUKFChQoVOnSoUKHcHRc/Pr6dnz+3r7KpQ4dGhyl06NChw5St4eHyyejA4sun3fmFs/sqmzpModGhQ4cOna3h0XLbgdGhxYfPu/OLp/dVNnXo0KFDh87WsLPcdmj0h8W7r7vzS6f2VTZ1aEyhszXsLLf9YfSXxZtvu/OrJ3+oXDPllx5uDY9f7/hffgOulqwRO2NSgAAAAABJRU5ErkJggg=='}} style={{width:size,height:size}} resizeMode="contain" accessibilityLabel="Like" />;

  if (name === 'check') return <View style={[s.box,{width:size,height:size}]}><View style={{position:'absolute',width:size*.42,height:size*.18,borderLeftWidth:stroke,borderBottomWidth:stroke,borderColor:color,transform:[{rotate:'-45deg'}],left:size*.28,top:size*.34}} /></View>;

  if (name === 'arrow-left') return <View style={[s.box,{width:size,height:size}]}><View style={{position:'absolute',width:size*.55,height:stroke,backgroundColor:color,left:size*.25,top:size*.46}}/><View style={{position:'absolute',width:size*.34,height:size*.34,borderLeftWidth:stroke,borderBottomWidth:stroke,borderColor:color,transform:[{rotate:'45deg'}],left:size*.2,top:size*.29}}/></View>;

  if (name === 'arrow-right') return <View style={[s.box,{width:size,height:size}]}><View style={{position:'absolute',width:size*.55,height:stroke,backgroundColor:color,left:size*.2,top:size*.46}}/><View style={{position:'absolute',width:size*.34,height:size*.34,borderRightWidth:stroke,borderTopWidth:stroke,borderColor:color,transform:[{rotate:'45deg'}],left:size*.46,top:size*.29}}/></View>;

  if (name === 'chevron-right') return <View style={[s.box,{width:size,height:size}]}><View style={{position:'absolute',width:size*.34,height:size*.34,borderRightWidth:stroke,borderTopWidth:stroke,borderColor:color,transform:[{rotate:'45deg'}],left:size*.22,top:size*.32}}/></View>;

  if (name === 'location') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.62,height:size*.62,left:size*.19,top:size*.08,borderWidth:stroke,borderColor:color,borderRadius:size*.5,transform:[{rotate:'45deg'}]}} />
      <View style={{position:'absolute',width:size*.16,height:size*.16,left:size*.42,top:size*.29,borderWidth:stroke,borderColor:color,borderRadius:size}} />
    </View>
  );

  if (name === 'clock') return <View style={[s.box,{width:size,height:size}]}><View style={{position:'absolute',width:size*.72,height:size*.72,borderWidth:stroke,borderColor:color,borderRadius:size,left:size*.14,top:size*.14}}/><View style={{position:'absolute',width:stroke,height:size*.25,backgroundColor:color,left:size*.48,top:size*.27}}/><View style={{position:'absolute',width:size*.2,height:stroke,backgroundColor:color,left:size*.48,top:size*.49}}/></View>;

  if (name === 'settings') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.52,height:size*.52,left:size*.24,top:size*.24,borderWidth:stroke,borderColor:color,borderRadius:size}} />
      {[0,1,2,3,4,5,6,7].map(i=><View key={i} style={{position:'absolute',width:size*.16,height:size*.16,left:size*.42,top:size*.42,backgroundColor:color,borderRadius:size*.04,transform:[{rotate:`${i*45}deg`},{translateY:-size*.34}]}} />)}
    </View>
  );

  if (name === 'info') return <View style={[s.box,{width:size,height:size}]}><View style={{position:'absolute',width:size*.72,height:size*.72,borderWidth:stroke,borderColor:color,borderRadius:size,left:size*.14,top:size*.14}}/><View style={{position:'absolute',width:stroke,height:size*.28,backgroundColor:color,left:size*.48,top:size*.38}}/><View style={{position:'absolute',width:size*.08,height:size*.08,borderRadius:size,backgroundColor:color,left:size*.46,top:size*.25}}/></View>;

  if (name === 'globe') return <View style={[s.box,{width:size,height:size}]}><View style={{position:'absolute',width:size*.72,height:size*.72,borderWidth:stroke,borderColor:color,borderRadius:size,left:size*.14,top:size*.14}}/><View style={{position:'absolute',width:size*.72,height:stroke,backgroundColor:color,left:size*.14,top:size*.48}}/><View style={{position:'absolute',width:size*.22,height:size*.72,borderLeftWidth:stroke,borderRightWidth:stroke,borderColor:color,left:size*.39,top:size*.14,borderRadius:size}}/></View>;

  if (name === 'chevron-down') return <View style={[s.box,{width:size,height:size}]}><View style={{position:'absolute',width:size*.36,height:size*.36,borderRightWidth:stroke,borderBottomWidth:stroke,borderColor:color,transform:[{rotate:'45deg'}],left:size*.3,top:size*.2}}/></View>;

  if (name === 'write') return <View style={[s.box,{width:size,height:size}]}><View style={{position:'absolute',width:size*.50,height:size*.16,left:size*.22,top:size*.40,backgroundColor:color,borderRadius:size*.04,transform:[{rotate:'-45deg'}]}}/><View style={{position:'absolute',width:size*.16,height:size*.16,left:size*.66,top:size*.18,backgroundColor:color,borderRadius:size*.02,transform:[{rotate:'-45deg'}]}}/><View style={{position:'absolute',width:0,height:0,left:size*.19,top:size*.70,borderTopWidth:size*.08,borderBottomWidth:size*.08,borderRightWidth:size*.14,borderTopColor:'transparent',borderBottomColor:'transparent',borderRightColor:color,transform:[{rotate:'-45deg'}]}}/></View>;

  if (name === 'search') return (
    <View style={[s.box, { width: size, height: size }]}>
      <View style={[s.searchCircle, { width: size * .55, height: size * .55, borderRadius: size, borderWidth: stroke, borderColor: color, left: size * .16, top: size * .12 }]} />
      <View style={[common, { width: size * .34, height: stroke, borderRadius: stroke, left: size * .58, top: size * .68, transform: [{ rotate: '45deg' }] }]} />
    </View>
  );

  if (name === 'bell') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.54,height:size*.58,left:size*.23,top:size*.15,borderWidth:stroke,borderColor:color,borderTopLeftRadius:size*.28,borderTopRightRadius:size*.28,borderBottomLeftRadius:size*.08,borderBottomRightRadius:size*.08}} />
      <View style={{position:'absolute',width:size*.70,height:stroke,left:size*.15,top:size*.70,backgroundColor:color,borderRadius:stroke}} />
      <View style={{position:'absolute',width:size*.14,height:size*.10,left:size*.43,top:size*.76,borderWidth:stroke,borderColor:color,borderBottomLeftRadius:size,borderBottomRightRadius:size}} />
    </View>
  );

  if (name === 'message') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.74,height:size*.55,left:size*.13,top:size*.14,borderWidth:stroke,borderColor:color,borderRadius:size*.17}} />
      <View style={{position:'absolute',width:size*.20,height:size*.20,left:size*.19,top:size*.59,borderLeftWidth:stroke,borderBottomWidth:stroke,borderColor:color,transform:[{skewX:'-28deg'}]}} />
      <View style={{position:'absolute',width:size*.34,height:stroke,left:size*.28,top:size*.36,backgroundColor:color,borderRadius:stroke}} />
      <View style={{position:'absolute',width:size*.22,height:stroke,left:size*.28,top:size*.50,backgroundColor:color,borderRadius:stroke}} />
    </View>
  );

  if (name === 'nav-profile' || name === 'profile') return <Image source={{uri:'data:image/png;base64,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'}} style={{width:size,height:size}} resizeMode="contain" accessibilityLabel="Profile" />;

  if (name === 'nav-home') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.52,height:size*.44,left:size*.24,top:size*.40,borderWidth:stroke,borderColor:color,borderTopWidth:0,borderRadius:size*.08}} />
      <View style={{position:'absolute',width:size*.42,height:stroke,left:size*.16,top:size*.30,backgroundColor:color,borderRadius:stroke,transform:[{rotate:'-45deg'}]}} />
      <View style={{position:'absolute',width:size*.42,height:stroke,left:size*.42,top:size*.30,backgroundColor:color,borderRadius:stroke,transform:[{rotate:'45deg'}]}} />
      <View style={{position:'absolute',width:size*.13,height:size*.23,left:size*.435,top:size*.57,borderWidth:stroke,borderBottomWidth:0,borderColor:color,borderTopLeftRadius:size*.04,borderTopRightRadius:size*.04}} />
    </View>
  );

  if (name === 'nav-explore') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.76,height:size*.76,left:size*.12,top:size*.12,borderWidth:stroke,borderColor:color,borderRadius:size}} />
      <View style={{position:'absolute',width:size*.24,height:size*.44,left:size*.38,top:size*.28,borderWidth:stroke,borderColor:color,transform:[{rotate:'42deg'}],borderRadius:size*.03}} />
      <View style={{position:'absolute',width:size*.07,height:size*.07,left:size*.465,top:size*.465,borderRadius:size,backgroundColor:color}} />
    </View>
  );

  if (name === 'nav-message') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.76,height:size*.57,left:size*.12,top:size*.13,borderWidth:stroke,borderColor:color,borderRadius:size*.18}} />
      <View style={{position:'absolute',width:size*.20,height:size*.20,left:size*.18,top:size*.58,borderLeftWidth:stroke,borderBottomWidth:stroke,borderColor:color,transform:[{skewX:'-28deg'}]}} />
    </View>
  );

  if (name === 'nav-bell') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.52,height:size*.58,left:size*.24,top:size*.14,borderWidth:stroke,borderColor:color,borderTopLeftRadius:size*.28,borderTopRightRadius:size*.28,borderBottomLeftRadius:size*.10,borderBottomRightRadius:size*.10}} />
      <View style={{position:'absolute',width:size*.70,height:stroke,left:size*.15,top:size*.70,backgroundColor:color,borderRadius:stroke}} />
      <View style={{position:'absolute',width:size*.13,height:size*.10,left:size*.435,top:size*.76,borderWidth:stroke,borderColor:color,borderBottomLeftRadius:size,borderBottomRightRadius:size}} />
    </View>
  );

  if (name === 'home') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.52,height:size*.44,left:size*.24,top:size*.38,borderWidth:stroke,borderColor:color,borderTopWidth:0,borderRadius:size*.08}} />
      <View style={{position:'absolute',width:size*.40,height:stroke,left:size*.17,top:size*.30,backgroundColor:color,borderRadius:stroke,transform:[{rotate:'-45deg'}]}} />
      <View style={{position:'absolute',width:size*.40,height:stroke,left:size*.43,top:size*.30,backgroundColor:color,borderRadius:stroke,transform:[{rotate:'45deg'}]}} />
      <View style={{position:'absolute',width:size*.13,height:size*.24,left:size*.435,top:size*.58,borderWidth:stroke,borderBottomWidth:0,borderColor:color,borderTopLeftRadius:size*.04,borderTopRightRadius:size*.04}} />
    </View>
  );

  if (name === 'compass') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.74,height:size*.74,left:size*.13,top:size*.13,borderWidth:stroke,borderColor:color,borderRadius:size}} />
      <View style={{position:'absolute',width:size*.30,height:size*.44,left:size*.35,top:size*.28,backgroundColor:color,transform:[{rotate:'45deg'}],borderRadius:size*.03}} />
      <View style={{position:'absolute',width:size*.14,height:size*.14,left:size*.43,top:size*.43,backgroundColor:'#060B12',transform:[{rotate:'45deg'}]}} />
    </View>
  );

  if (name === 'users') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.25,height:size*.25,left:size*.22,top:size*.12,borderWidth:stroke,borderColor:color,borderRadius:size}} />
      <View style={{position:'absolute',width:size*.25,height:size*.25,left:size*.53,top:size*.12,borderWidth:stroke,borderColor:color,borderRadius:size}} />
      <View style={{position:'absolute',width:size*.46,height:size*.25,left:size*.10,top:size*.55,borderWidth:stroke,borderColor:color,borderRadius:size*.25}} />
      <View style={{position:'absolute',width:size*.46,height:size*.25,left:size*.44,top:size*.55,borderWidth:stroke,borderColor:color,borderRadius:size*.25}} />
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
      <View style={{position:'absolute',width:size*.22,height:stroke,left:size*.18,top:size*.64,backgroundColor:color,transform:[{rotate:'-45deg'}]}} />
    </View>
  );

  if (name === 'share') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.62,height:stroke,left:size*.15,top:size*.54,backgroundColor:color,borderRadius:stroke,transform:[{rotate:'-25deg'}]}} />
      <View style={{position:'absolute',width:size*.38,height:size*.38,left:size*.47,top:size*.12,borderTopWidth:stroke,borderRightWidth:stroke,borderColor:color,transform:[{rotate:'45deg'}]}} />
      <View style={{position:'absolute',width:size*.38,height:size*.38,left:size*.47,top:size*.50,borderBottomWidth:stroke,borderRightWidth:stroke,borderColor:color,transform:[{rotate:'-45deg'}]}} />
    </View>
  );

  if (name === 'more') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.12,height:size*.12,borderRadius:size,backgroundColor:color,left:size*.44,top:size*.16}} />
      <View style={{position:'absolute',width:size*.12,height:size*.12,borderRadius:size,backgroundColor:color,left:size*.44,top:size*.44}} />
      <View style={{position:'absolute',width:size*.12,height:size*.12,borderRadius:size,backgroundColor:color,left:size*.44,top:size*.72}} />
    </View>
  );

  if (name === 'spark') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.18,height:size*.72,left:size*.41,top:size*.14,backgroundColor:color,borderRadius:size*.09,transform:[{rotate:'45deg'}]}} />
      <View style={{position:'absolute',width:size*.18,height:size*.72,left:size*.41,top:size*.14,backgroundColor:color,borderRadius:size*.09,transform:[{rotate:'-45deg'}]}} />
      <View style={{position:'absolute',width:size*.16,height:size*.16,left:size*.42,top:size*.42,backgroundColor:color,borderRadius:size}} />
    </View>
  );

  if (name === 'play') return (
    <View style={[s.box,{width:size,height:size,alignItems:'center',justifyContent:'center'}]}>
      <View style={{marginLeft:size*.08,width:0,height:0,borderTopWidth:size*.30,borderBottomWidth:size*.30,borderLeftWidth:size*.46,borderTopColor:'transparent',borderBottomColor:'transparent',borderLeftColor:color}} />
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

  if (name === 'archive') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.72,height:size*.12,left:size*.14,top:size*.20,borderWidth:stroke,borderColor:color,borderRadius:size*.03}} />
      <View style={{position:'absolute',width:size*.62,height:size*.48,left:size*.19,top:size*.32,borderWidth:stroke,borderColor:color,borderTopWidth:0,borderBottomLeftRadius:size*.08,borderBottomRightRadius:size*.08}} />
      <View style={{position:'absolute',width:size*.22,height:stroke,left:size*.39,top:size*.50,backgroundColor:color,borderRadius:stroke}} />
    </View>
  );

  if (name === 'heart') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.36,height:size*.36,left:size*.18,top:size*.16,borderWidth:stroke,borderColor:color,borderTopLeftRadius:size*.20,borderTopRightRadius:size*.20,transform:[{rotate:'45deg'}]}} />
      <View style={{position:'absolute',width:size*.36,height:size*.36,left:size*.46,top:size*.16,borderWidth:stroke,borderColor:color,borderTopLeftRadius:size*.20,borderTopRightRadius:size*.20,transform:[{rotate:'45deg'}]}} />
      <View style={{position:'absolute',width:size*.42,height:size*.42,left:size*.29,top:size*.31,borderRightWidth:stroke,borderBottomWidth:stroke,borderColor:color,transform:[{rotate:'45deg'}]}} />
    </View>
  );

  if (name === 'bookmark') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.52,height:size*.70,left:size*.24,top:size*.12,borderWidth:stroke,borderBottomWidth:0,borderColor:color,borderRadius:size*.04}} />
      <View style={{position:'absolute',width:size*.30,height:size*.30,left:size*.35,top:size*.50,borderLeftWidth:stroke,borderBottomWidth:stroke,borderColor:color,transform:[{rotate:'-45deg'}]}} />
    </View>
  );

  if (name === 'eye') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.76,height:size*.48,borderWidth:stroke,borderColor:color,borderRadius:size*.5,left:size*.12,top:size*.26}} />
      <View style={{position:'absolute',width:size*.20,height:size*.20,borderRadius:size,backgroundColor:color,left:size*.40,top:size*.40}} />
    </View>
  );

  if (name === 'eye-off') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.76,height:size*.48,borderWidth:stroke,borderColor:color,borderRadius:size*.5,left:size*.12,top:size*.26}} />
      <View style={{position:'absolute',width:stroke,height:size*.92,backgroundColor:color,transform:[{rotate:'45deg'}],borderRadius:stroke}} />
    </View>
  );

  if (name === 'close') return (
    <View style={[s.box,{width:size,height:size}]}>
      <View style={{position:'absolute',width:size*.68,height:stroke,backgroundColor:color,transform:[{rotate:'45deg'}],borderRadius:stroke}} />
      <View style={{position:'absolute',width:size*.68,height:stroke,backgroundColor:color,transform:[{rotate:'-45deg'}],borderRadius:stroke}} />
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

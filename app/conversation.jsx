 const bubbleShape={borderRadius:bubble.radius,borderBottomRightRadius:bubbleStyle==='classic'?5:bubble.radius,borderBottomLeftRadius:bubbleStyle==='classic'?5:bubble.radius};
 return (
  <SafeAreaView style={[s.safe,themeStyles.safe]}>
  <KeyboardAvoidingView style={s.flex} behavior={Platform.OS==='ios'?'padding':undefined} keyboardVerticalOffset={8}>
   <View style={[s.head,themeStyles.head]}>
    <Pressable onPress={()=>router.back()} hitSlop={10} style={s.backButton}><AppIcon name="arrow-left" size={18}/></Pressable>
    <Pressable onPress={()=>info?.kind==='group'?setChatInfoOpen(true):(info?.other?.user_id?router.push({pathname:'/profile',params:{id:info.other.user_id}}):null)} hitSlop={8} style={s.avatar} accessibilityRole="button" accessibilityLabel={info?.kind==='group'?'Open group info':`Open ${name} profile`}>
     {avatar?<Image source={{uri:getImageUrl(avatar,{width:800,height:800,quality:100})}} style={s.avatarImage}/>:<Text style={s.avatarText}>{initials}</Text>}
    </Pressable>
    <View style={s.headCopy}>
     <Text style={s.name} numberOfLines={1}>{name}</Text>
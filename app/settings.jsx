import { useMemo, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';

const C = {
  bg: '#050A11',
  panel: '#09121E',
  panel2: '#0D1928',
  line: '#17283B',
  text: '#F5F7FA',
  muted: '#8795A8',
  blue: '#3B82F6',
  violet: '#7C3AED',
  pink: '#D946EF',
  green: '#22C55E',
  danger: '#EF4444',
};

const settingItems = [
  ['Account', 'Username, email, bio, profile', '◯'],
  ['Privacy & Security', 'Password, 2FA, active sessions', '▣'],
  ['Notifications', 'Push, email, in-app', '♧'],
  ['Appearance', 'Dark mode, font size, language', '☼'],
  ['Data & Storage', 'Downloads, cache, media', '▤'],
  ['Help & Support', 'FAQs, contact us, report a problem', '?'],
  ['About Freetopia', 'Version, terms, privacy', 'ⓘ'],
];

export default function Settings() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const desktop = Platform.OS === 'web' && width >= 1000;
  const [active, setActive] = useState('Account');
  const [privateOverride, setPrivateOverride] = useState(null);
  const [password, setPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const privateProfile = privateOverride ?? !!profile?.is_private;
  const name = profile?.display_name || user?.email?.split('@')[0] || 'Freetopia member';
  const handle = profile?.username ? '@' + profile.username : '@freetopia_member';
  const initials = useMemo(() => name.charAt(0).toUpperCase(), [name]);

  const updatePrivacy = async () => {
    if (!user?.id || privacyBusy) return;
    const next = !privateProfile;
    setPrivateOverride(next);
    setPrivacyBusy(true);
    const { error } = await supabase.from('profiles').update({ is_private: next }).eq('id', user.id);
    if (error) {
      setPasswordMessage(error.message);
    } else {
      await refreshProfile();
    }
    setPrivateOverride(null);
    setPrivacyBusy(false);
  };

  const updatePassword = async () => {
    if (!password || passwordBusy) return;
    if (password.length < 6) {
      setPasswordMessage('Password must be at least 6 characters.');
      return;
    }
    setPasswordBusy(true);
    setPasswordMessage('');
    const { error } = await supabase.auth.updateUser({ password });
    setPasswordBusy(false);
    if (error) {
      setPasswordMessage(error.message);
      return;
    }
    setPassword('');
    setPasswordMessage('Password updated successfully.');
  };

  const go = (item) => {
    if (item === 'Account') setActive('Account');
    else if (item === 'Privacy & Security') setActive('Privacy & Security');
    else setActive(item);
  };

  if (desktop) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.desktopShell}>
          <Sidebar router={router} />
          <View style={s.desktopMain}>
            <Topbar router={router} />
            <View style={s.desktopGrid}>
              <ScrollView style={s.settingsNav} contentContainerStyle={s.settingsNavContent} showsVerticalScrollIndicator={false}>
                <Text style={s.settingsNavTitle}>Settings</Text>
                {settingItems.map(([title, subtitle, icon]) => (
                  <Pressable key={title} onPress={() => go(title)} style={[s.navRow, active === title && s.navRowActive]}>
                    <View style={[s.navIcon, active === title && s.navIconActive]}><Text style={s.navIconText}>{icon}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.navTitle}>{title}</Text>
                      <Text style={s.navSubtitle}>{subtitle}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>

              <ScrollView style={s.mainPanel} contentContainerStyle={s.mainPanelContent} showsVerticalScrollIndicator={false}>
                <View style={s.panelHeading}>
                  <View>
                    <Text style={s.pageTitle}>{active}</Text>
                    <Text style={s.pageSubtitle}>{active === 'Account' ? 'Manage your personal information and how others see you.' : active === 'Privacy & Security' ? 'Control visibility and keep your account secure.' : 'This section is prepared for the next connected settings layer.'}</Text>
                  </View>
                  {active === 'Account' ? <Pressable onPress={() => router.push('/edit-profile')} style={s.smallButton}><Text style={s.smallButtonText}>Edit Profile</Text></Pressable> : null}
                </View>
                {active === 'Account'
                  ? <AccountPanel name={name} handle={handle} initials={initials} email={user?.email} profile={profile} onEdit={() => router.push('/edit-profile')} />
                  : active === 'Privacy & Security'
                    ? <SecurityPanel privateProfile={privateProfile} onToggle={updatePrivacy} privacyBusy={privacyBusy} password={password} setPassword={setPassword} onPassword={updatePassword} passwordBusy={passwordBusy} passwordMessage={passwordMessage} />
                    : <ComingSoon title={active} />}
              </ScrollView>

              <RightRail profile={profile} name={name} handle={handle} onEdit={() => router.push('/edit-profile')} privateProfile={privateProfile} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.mobileContent}>
        <View style={s.mobileHeader}>
          <Pressable onPress={() => router.back()} hitSlop={12}><Text style={s.back}>‹</Text></Pressable>
          <Text style={s.mobileTitle}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <Pressable onPress={() => router.push('/edit-profile')} style={s.mobileProfileCard}>
          <Avatar initials={initials} avatar={profile?.avatar_url} size={62} />
          <View style={{ flex: 1 }}>
            <Text style={s.mobileProfileName}>{name} <Text style={s.verified}>✓</Text></Text>
            <Text style={s.mobileProfileHandle}>{handle}</Text>
            <Text style={s.mobileProfileBio} numberOfLines={1}>{profile?.bio || 'Dream big. Build bigger.'}</Text>
          </View>
          <Text style={s.chevron}>›</Text>
        </Pressable>

        <Text style={s.mobileSectionLabel}>ACCOUNT</Text>
        <View style={s.mobileList}>
          {settingItems.slice(0, 5).map(([title, subtitle, icon], index) => (
            <Pressable key={title} onPress={() => go(title)} style={[s.mobileRow, index === 4 && s.mobileRowLast]}>
              <View style={s.mobileIcon}><Text style={s.mobileIconText}>{icon}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.mobileRowTitle}>{title}</Text>
                <Text style={s.mobileRowSub}>{subtitle}</Text>
              </View>
              <Text style={s.chevron}>›</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.mobileSectionLabel}>SUPPORT</Text>
        <View style={s.mobileList}>
          {settingItems.slice(5).map(([title, subtitle, icon], index) => (
            <Pressable key={title} onPress={() => go(title)} style={[s.mobileRow, index === 1 && s.mobileRowLast]}>
              <View style={s.mobileIcon}><Text style={s.mobileIconText}>{icon}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.mobileRowTitle}>{title}</Text>
                <Text style={s.mobileRowSub}>{subtitle}</Text>
              </View>
              <Text style={s.chevron}>›</Text>
            </Pressable>
          ))}
        </View>

        {active === 'Privacy & Security' ? (
          <View style={s.mobileSecurity}>
            <Text style={s.sectionTitle}>Privacy & Security</Text>
            <SettingToggle title="Private profile" subtitle="Only approved followers can see your profile and follower-only content." value={privateProfile} onPress={updatePrivacy} />
            <Text style={s.sectionTitle}>Change password</Text>
            <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="New password" placeholderTextColor={C.muted} style={s.passwordInput} />
            <Pressable onPress={updatePassword} disabled={passwordBusy} style={s.primaryButton}><Text style={s.primaryButtonText}>{passwordBusy ? 'Updating…' : 'Update Password'}</Text></Pressable>
            {!!passwordMessage && <Text style={s.message}>{passwordMessage}</Text>}
          </View>
        ) : null}

        <Pressable onPress={signOut} style={s.mobileLogout}><Text style={s.logoutText}>Log Out</Text><Text style={s.chevron}>›</Text></Pressable>
        <Text style={s.version}>Freetopia · Account settings</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function AccountPanel({ name, handle, initials, email, profile, onEdit }) {
  return (
    <>
      <View style={s.card}>
        <View style={s.profileSummary}>
          <Avatar initials={initials} avatar={profile?.avatar_url} size={72} />
          <View style={{ flex: 1 }}>
            <Text style={s.summaryName}>{name} <Text style={s.verified}>✓</Text></Text>
            <Text style={s.summaryHandle}>{handle}</Text>
            <Text style={s.summaryBio}>{profile?.bio || 'Add a short bio from Edit Profile.'}</Text>
          </View>
        </View>
        <View style={s.statsRow}>
          <MiniStat label="Profile" value={profile?.is_private ? 'Private' : 'Public'} />
          <MiniStat label="Username" value={profile?.username ? '@' + profile.username : 'Not set'} />
          <MiniStat label="Email" value={email || 'Not available'} />
        </View>
      </View>

      <View style={s.card}>
        <View style={s.cardHeading}><Text style={s.cardTitle}>Account Information</Text><Text style={s.cardHint}>Update your account details through the connected controls.</Text></View>
        <InfoField label="Full Name" value={name} />
        <InfoField label="Username" value={profile?.username || 'Not set'} />
        <InfoField label="Email Address" value={email || 'Not available'} />
        <Pressable onPress={onEdit} style={s.outlineWide}><Text style={s.outlineWideText}>Edit Profile Details</Text></Pressable>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Privacy & Security</Text>
        <SettingLine icon="◉" title="Profile visibility" subtitle={profile?.is_private ? 'Private profile' : 'Public profile'} />
        <SettingLine icon="▣" title="Password" subtitle="Manage your sign-in password" />
        <SettingLine icon="◌" title="Two-Factor Authentication" subtitle="Not connected yet" muted />
        <SettingLine icon="▤" title="Active Sessions" subtitle="Session management is not connected yet" muted last />
      </View>
    </>
  );
}

function SecurityPanel({ privateProfile, onToggle, privacyBusy, password, setPassword, onPassword, passwordBusy, passwordMessage }) {
  return (
    <>
      <View style={s.card}>
        <Text style={s.cardTitle}>Privacy</Text>
        <SettingToggle title="Private profile" subtitle="Anyone can see your public profile when this is off. Turn it on to require approved followers." value={privateProfile} onPress={onToggle} disabled={privacyBusy} />
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Password</Text>
        <Text style={s.cardHint}>Set a new password for your Freetopia account.</Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="New password" placeholderTextColor={C.muted} style={s.passwordInput} />
        <Pressable onPress={onPassword} disabled={passwordBusy} style={s.primaryButton}><Text style={s.primaryButtonText}>{passwordBusy ? 'Updating…' : 'Update Password'}</Text></Pressable>
        {!!passwordMessage && <Text style={s.message}>{passwordMessage}</Text>}
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Additional security</Text>
        <SettingLine icon="◌" title="Two-Factor Authentication" subtitle="Not connected yet" muted />
        <SettingLine icon="▤" title="Active Sessions" subtitle="Session management is not connected yet" muted last />
      </View>
    </>
  );
}

function ComingSoon({ title }) {
  return <View style={s.card}><Text style={s.cardTitle}>{title}</Text><Text style={s.comingTitle}>Designed, not falsely wired.</Text><Text style={s.comingBody}>This section is reserved for the next Freetopia settings layer. No fake controls are presented as working.</Text></View>;
}

function RightRail({ profile, name, handle, onEdit, privateProfile }) {
  return <View style={s.rightRail}>
    <View style={s.railCard}>
      <Text style={s.railTitle}>Appearance</Text>
      <SettingLine icon="☾" title="Dark Mode" subtitle="Freetopia dark theme" />
      <SettingLine icon="☼" title="Light" subtitle="Not connected yet" muted />
      <SettingLine icon="▣" title="System" subtitle="Not connected yet" muted last />
    </View>
    <View style={s.railCard}>
      <Text style={s.railTitle}>Language</Text>
      <SettingLine icon="◎" title="English" subtitle="Preferred language" last />
    </View>
    <View style={s.railCard}>
      <Text style={s.railTitle}>Privacy</Text>
      <SettingLine icon="◉" title={privateProfile ? 'Private profile' : 'Public profile'} subtitle="Profile visibility" last />
    </View>
    <View style={s.railCard}>
      <Text style={s.railTitle}>Quick Actions</Text>
      <Pressable onPress={onEdit} style={s.quickRow}><Text style={s.quickIcon}>◉</Text><Text style={s.quickText}>Edit Profile</Text><Text style={s.chevron}>›</Text></Pressable>
      <Pressable style={s.quickRow}><Text style={s.quickIcon}>▤</Text><Text style={s.quickText}>Data & Storage</Text><Text style={s.chevron}>›</Text></Pressable>
      <Pressable style={s.quickRow}><Text style={s.quickIcon}>?</Text><Text style={s.quickText}>Help & Support</Text><Text style={s.chevron}>›</Text></Pressable>
    </View>
    <View style={s.promo}><Image source={require('../public/brand/freetopia-mark.png')} style={s.promoLogo}/><Text style={s.promoTitle}>Your journey matters.</Text><Text style={s.promoBody}>Keep building your world.</Text></View>
  </View>;
}

function Sidebar({ router }) {
  const items = [['⌂','Home','/home'],['⌕','Explore','/explore'],['♧','Communities','/communities'],['▱','Messages','/messages'],['♧','Notifications','/notifications'],['＋','Create','/create'],['♙','Profile','/profile']];
  return <View style={s.sidebar}>
    <View style={s.brand}><Image source={require('../public/brand/freetopia-mark.png')} style={s.logo}/><Text style={s.brandText}>Freetopia</Text></View>
    <View style={s.sideNav}>{items.map(([icon,label,path]) => <Pressable key={label} onPress={() => router.push(path)} style={s.sideItem}><Text style={s.sideIcon}>{icon}</Text><Text style={s.sideLabel}>{label}</Text>{label === 'Messages' ? <Badge n="3"/> : null}{label === 'Notifications' ? <Badge n="5"/> : null}</Pressable>)}</View>
    <View style={s.sidebarPromo}><Image source={require('../public/brand/freetopia-mark.png')} style={s.promoLogo}/><Text style={s.sidebarPromoTitle}>Your journey matters.</Text><Text style={s.sidebarPromoBody}>Keep building.</Text><Pressable style={s.promoButton}><Text style={s.promoButtonText}>Upgrade →</Text></Pressable></View>
  </View>;
}

function Topbar({ router }) {
  return <View style={s.topbar}><TextInput placeholder="⌕  Search settings..." placeholderTextColor="#667991" style={s.search}/><View style={s.topIcons}><Text style={s.topIcon}>♧</Text><Text style={s.topIcon}>▱</Text><Pressable onPress={() => router.push('/profile')}><View style={s.topAvatar}><Text style={s.topAvatarText}>F</Text></View></Pressable></View></View>;
}

function Badge({ n }) { return <View style={s.badge}><Text style={s.badgeText}>{n}</Text></View>; }

function Avatar({ avatar, initials, size }) {
  return avatar ? <Image source={{ uri: avatar }} style={{ width:size, height:size, borderRadius:size/2, borderWidth:1, borderColor:'#9DB4D1' }} /> :
    <View style={{ width:size, height:size, borderRadius:size/2, backgroundColor:'#1B2B42', borderWidth:1, borderColor:'#9DB4D1', alignItems:'center', justifyContent:'center' }}><Text style={{ color:C.text, fontSize:size*.32, fontWeight:'800' }}>{initials}</Text></View>;
}

function InfoField({ label, value }) {
  return <View style={s.infoField}><Text style={s.fieldLabel}>{label}</Text><View style={s.readonly}><Text style={s.readonlyText} numberOfLines={1}>{value}</Text></View></View>;
}

function MiniStat({ label, value }) { return <View style={s.miniStat}><Text style={s.miniValue} numberOfLines={1}>{value}</Text><Text style={s.miniLabel}>{label}</Text></View>; }

function SettingLine({ icon, title, subtitle, muted, last }) {
  return <View style={[s.settingLine, last && s.settingLineLast, muted && s.mutedRow]}><View style={s.lineIcon}><Text style={s.lineIconText}>{icon}</Text></View><View style={{ flex:1 }}><Text style={s.lineTitle}>{title}</Text><Text style={s.lineSub}>{subtitle}</Text></View><Text style={s.chevron}>›</Text></View>;
}

function SettingToggle({ title, subtitle, value, onPress, disabled }) {
  return <Pressable onPress={onPress} disabled={disabled} style={s.toggleRow}><View style={{ flex:1 }}><Text style={s.lineTitle}>{title}</Text><Text style={s.lineSub}>{subtitle}</Text></View><View style={[s.toggle, value && s.toggleOn, disabled && { opacity:.5 }]}><View style={[s.toggleKnob, value && s.toggleKnobOn]} /></View></Pressable>;
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},
  desktopShell:{flex:1,flexDirection:'row',backgroundColor:C.bg},
  sidebar:{width:205,padding:16,paddingTop:24,borderRightWidth:1,borderRightColor:C.line,backgroundColor:'#060D16'},
  brand:{flexDirection:'row',alignItems:'center',gap:9},
  logo:{width:34,height:34},brandText:{color:C.text,fontSize:17,fontWeight:'800'},
  sideNav:{marginTop:34,gap:4,flex:1},
  sideItem:{minHeight:45,paddingHorizontal:11,borderRadius:10,flexDirection:'row',alignItems:'center',gap:12},
  sideIcon:{width:20,color:'#AFC0D3',fontSize:18,textAlign:'center'},sideLabel:{color:'#C9D4E2',fontSize:12,fontWeight:'600',flex:1},
  badge:{minWidth:18,height:18,borderRadius:9,backgroundColor:C.violet,alignItems:'center',justifyContent:'center'},badgeText:{color:'#fff',fontSize:9,fontWeight:'800'},
  sidebarPromo:{marginTop:'auto',borderRadius:14,padding:14,backgroundColor:'#25104B',borderWidth:1,borderColor:'#5A2BB2'},
  sidebarPromoTitle:{color:C.text,fontSize:12,fontWeight:'800',marginTop:8},sidebarPromoBody:{color:'#C4B7E8',fontSize:10,marginTop:3},
  desktopMain:{flex:1,minWidth:0},topbar:{height:72,borderBottomWidth:1,borderBottomColor:C.line,flexDirection:'row',alignItems:'center',paddingHorizontal:20,gap:20},
  search:{height:38,maxWidth:510,flex:1,borderRadius:11,backgroundColor:'#0B1A2B',borderWidth:1,borderColor:'#19304A',paddingHorizontal:14,color:C.text,fontSize:11},
  topIcons:{flexDirection:'row',alignItems:'center',gap:20},topIcon:{color:C.text,fontSize:20},topAvatar:{width:34,height:34,borderRadius:17,backgroundColor:'#31435B',alignItems:'center',justifyContent:'center'},topAvatarText:{color:'#fff',fontWeight:'800'},
  desktopGrid:{flex:1,flexDirection:'row',minHeight:0},
  settingsNav:{width:250,borderRightWidth:1,borderRightColor:C.line},settingsNavContent:{padding:16,gap:4},
  settingsNavTitle:{fontSize:23,fontWeight:'800',color:C.text,paddingHorizontal:4,paddingBottom:12},
  navRow:{minHeight:66,padding:10,borderRadius:10,flexDirection:'row',alignItems:'center',gap:10},navRowActive:{backgroundColor:'#25207A'},
  navIcon:{width:34,height:34,borderRadius:10,alignItems:'center',justifyContent:'center'},navIconActive:{backgroundColor:'#4D35D6'},navIconText:{color:C.text,fontSize:17},
  navTitle:{color:C.text,fontSize:12,fontWeight:'700'},navSubtitle:{color:C.muted,fontSize:9,lineHeight:13,marginTop:2},
  mainPanel:{flex:1,minWidth:0},mainPanelContent:{padding:16,maxWidth:720,width:'100%'},
  panelHeading:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:14,marginBottom:14},pageTitle:{color:C.text,fontSize:22,fontWeight:'800'},pageSubtitle:{color:C.muted,fontSize:10,marginTop:4,lineHeight:15},
  smallButton:{height:32,paddingHorizontal:14,borderRadius:9,borderWidth:1,borderColor:'#294363',alignItems:'center',justifyContent:'center'},smallButtonText:{color:C.text,fontSize:10,fontWeight:'700'},
  card:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:12,padding:16,marginBottom:12},profileSummary:{flexDirection:'row',alignItems:'center',gap:14},summaryName:{color:C.text,fontSize:16,fontWeight:'800'},verified:{color:C.blue},summaryHandle:{color:'#A0AEC0',fontSize:10,marginTop:2},summaryBio:{color:'#C7D0DC',fontSize:10,marginTop:5},statsRow:{flexDirection:'row',borderTopWidth:1,borderTopColor:C.line,marginTop:16,paddingTop:14},
  miniStat:{flex:1,borderRightWidth:1,borderRightColor:C.line,paddingHorizontal:10},miniStatLast:{borderRightWidth:0},miniValue:{color:C.text,fontSize:11,fontWeight:'800'},miniLabel:{color:C.muted,fontSize:9,marginTop:3},
  cardHeading:{marginBottom:10},cardTitle:{color:C.text,fontSize:14,fontWeight:'800'},cardHint:{color:C.muted,fontSize:9,lineHeight:14,marginTop:3},
  infoField:{marginTop:11},fieldLabel:{color:'#A8B5C7',fontSize:9,marginBottom:5},readonly:{height:40,borderRadius:8,borderWidth:1,borderColor:'#20354D',backgroundColor:'#0B1726',justifyContent:'center',paddingHorizontal:12},readonlyText:{color:C.text,fontSize:11},
  outlineWide:{height:40,borderRadius:9,borderWidth:1,borderColor:'#2B4665',alignItems:'center',justifyContent:'center',marginTop:14},outlineWideText:{color:C.text,fontSize:10,fontWeight:'800'},
  settingLine:{minHeight:48,flexDirection:'row',alignItems:'center',gap:10,borderBottomWidth:1,borderBottomColor:C.line},settingLineLast:{borderBottomWidth:0},lineIcon:{width:28,height:28,borderRadius:8,backgroundColor:'#0E2135',alignItems:'center',justifyContent:'center'},lineIconText:{color:'#C8D5E5',fontSize:14},lineTitle:{color:C.text,fontSize:10,fontWeight:'700'},lineSub:{color:C.muted,fontSize:8,lineHeight:12,marginTop:2},mutedRow:{opacity:.55},chevron:{color:'#8090A4',fontSize:20},
  toggleRow:{minHeight:64,flexDirection:'row',alignItems:'center',gap:14,borderBottomWidth:1,borderBottomColor:C.line},toggle:{width:42,height:24,borderRadius:12,backgroundColor:'#18273A',borderWidth:1,borderColor:'#2A415C',padding:2,justifyContent:'center'},toggleOn:{backgroundColor:C.violet,borderColor:C.pink},toggleKnob:{width:18,height:18,borderRadius:9,backgroundColor:'#8090A4'},toggleKnobOn:{alignSelf:'flex-end',backgroundColor:'#fff'},
  passwordInput:{height:42,borderRadius:9,borderWidth:1,borderColor:'#20354D',backgroundColor:'#0B1726',paddingHorizontal:12,color:C.text,fontSize:11,marginTop:12},primaryButton:{height:40,borderRadius:9,backgroundColor:C.violet,alignItems:'center',justifyContent:'center',marginTop:10},primaryButtonText:{color:'#fff',fontSize:10,fontWeight:'800'},message:{color:C.muted,fontSize:9,marginTop:8},
  rightRail:{width:270,padding:12,borderLeftWidth:1,borderLeftColor:C.line},railCard:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:12,padding:12,marginBottom:10},railTitle:{color:C.text,fontSize:12,fontWeight:'800',marginBottom:6},quickRow:{minHeight:42,flexDirection:'row',alignItems:'center',gap:9,borderBottomWidth:1,borderBottomColor:C.line},quickIcon:{color:'#C6D3E2',fontSize:15},quickText:{color:C.text,fontSize:10,fontWeight:'600',flex:1},
  promo:{backgroundColor:'#291047',borderWidth:1,borderColor:'#5C2BB5',borderRadius:12,padding:14,overflow:'hidden'},promoLogo:{width:34,height:34},promoTitle:{color:C.text,fontSize:13,fontWeight:'800',marginTop:8},promoBody:{color:'#CDBFEB',fontSize:9,marginTop:3},promoButton:{marginTop:12,height:34,paddingHorizontal:14,borderRadius:17,backgroundColor:C.blue,alignItems:'center',justifyContent:'center'},promoButtonText:{color:'#fff',fontSize:9,fontWeight:'800'},
  comingTitle:{color:C.text,fontSize:18,fontWeight:'800',marginTop:18},comingBody:{color:C.muted,fontSize:11,lineHeight:18,marginTop:8},
  mobileContent:{padding:16,paddingBottom:34,backgroundColor:C.bg},mobileHeader:{height:48,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10},back:{color:C.text,fontSize:31,fontWeight:'300',lineHeight:32},mobileTitle:{color:C.text,fontSize:20,fontWeight:'800'},
  mobileProfileCard:{minHeight:92,borderRadius:12,borderWidth:1,borderColor:C.line,backgroundColor:C.panel,padding:13,flexDirection:'row',alignItems:'center',gap:12},mobileProfileName:{color:C.text,fontSize:15,fontWeight:'800'},mobileProfileHandle:{color:C.muted,fontSize:9,marginTop:2},mobileProfileBio:{color:'#C8D2DF',fontSize:9,marginTop:5},
  mobileSectionLabel:{color:'#75869A',fontSize:9,fontWeight:'800',letterSpacing:1.2,marginTop:22,marginBottom:7},mobileList:{borderWidth:1,borderColor:C.line,borderRadius:12,overflow:'hidden',backgroundColor:C.panel},mobileRow:{minHeight:70,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:11,borderBottomWidth:1,borderBottomColor:C.line},mobileRowLast:{borderBottomWidth:0},mobileIcon:{width:34,height:34,borderRadius:10,backgroundColor:'#0D2135',alignItems:'center',justifyContent:'center'},mobileIconText:{color:'#D4DEEA',fontSize:16},mobileRowTitle:{color:C.text,fontSize:11,fontWeight:'700'},mobileRowSub:{color:C.muted,fontSize:8,lineHeight:12,marginTop:3},
  mobileSecurity:{marginTop:14,borderWidth:1,borderColor:C.line,borderRadius:12,padding:14,backgroundColor:C.panel},sectionTitle:{color:C.text,fontSize:13,fontWeight:'800',marginBottom:8},mobileLogout:{height:48,marginTop:18,borderRadius:11,borderWidth:1,borderColor:'#5B1E35',backgroundColor:'#1B0D17',paddingHorizontal:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},logoutText:{color:'#FF5E7B',fontSize:11,fontWeight:'800'},version:{textAlign:'center',color:'#53647A',fontSize:8,marginTop:18},
});

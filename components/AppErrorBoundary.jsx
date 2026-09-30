import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default class AppErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (__DEV__) {
      console.error('Freetopia render error:', error, info?.componentStack);
    }
  }

  retry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={s.root}>
        <View style={s.card}>
          <View style={s.icon}><Text style={s.iconText}>!</Text></View>
          <Text style={s.title}>Something went wrong</Text>
          <Text style={s.body}>
            Freetopia hit an unexpected screen error. Your account and data are still safe.
          </Text>
          <Pressable onPress={this.retry} style={({ pressed }) => [s.button, pressed && s.pressed]}>
            <Text style={s.buttonText}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060B12',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#182533',
    borderRadius: 18,
    backgroundColor: '#0A121C',
    padding: 22,
    alignItems: 'center',
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#26384D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#E9EEF4',
    fontSize: 22,
    fontWeight: '900',
  },
  title: {
    color: '#E9EEF4',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 14,
  },
  body: {
    color: '#7F8D9D',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    marginTop: 18,
    minHeight: 42,
    paddingHorizontal: 18,
    borderRadius: 11,
    backgroundColor: '#304B68',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#F4F6F8',
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
});

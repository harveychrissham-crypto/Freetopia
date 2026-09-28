const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withFreetopiaPortrait(config) {
  return withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    const activities = application?.activity || [];

    for (const activity of activities) {
      const name = activity.$?.['android:name'];
      if (name === '.MainActivity' || name === 'com.freetopia.app.MainActivity') {
        activity.$['android:screenOrientation'] = 'portrait';
      }
    }

    return mod;
  });
};

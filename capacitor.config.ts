import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lendtrack.app',
  appName: 'LendTrack',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

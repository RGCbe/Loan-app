import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.metrix.app',
  appName: 'Metrix',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

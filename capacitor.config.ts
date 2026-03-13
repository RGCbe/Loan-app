import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.metrix.app',
  appName: 'Metrix',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: 'https://me-trix.in',
    cleartext: false
  }
};

export default config;

import type {CapacitorConfig} from '@capacitor/cli';
const config:CapacitorConfig={
 appId:'dk.peaknet.nextmove',
 appName:'Next Move',
 webDir:'dist',
 ios:{contentInset:'automatic',backgroundColor:'#f7f6f1'},
 // Bundle assets locally. Never point a release build at a live website.
};
export default config;

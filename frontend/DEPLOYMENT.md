# VocalClerk App Deployment Guide

This guide provides instructions for deploying the VocalClerk app to Android and iOS devices.

## Prerequisites

- Node.js (v16 or newer)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- Expo account (create one at https://expo.dev/signup)
- Apple Developer account (for iOS deployment)
- Google Play Developer account (for Android deployment)

## Setup EAS Build

EAS (Expo Application Services) Build is the recommended way to build your app for distribution.

1. **Login to your Expo account**:
   ```bash
   eas login
   ```

2. **Configure your project**:
   ```bash
   eas build:configure
   ```

3. **Update your project ID** in `app.json`:
   Replace `"your-project-id"` with the actual project ID from your Expo account.

## Building for Development (Development Builds)

Development builds allow you to test your app on physical devices with developer tools.

1. **Create a development build**:
   ```bash
   cd frontend
   eas build --profile development --platform all
   ```

2. **Install on your device**:
   - For Android: Download the APK from the link provided after the build completes
   - For iOS: Use the QR code or link provided after the build completes

## Building for Testing (Preview Builds)

Preview builds are useful for internal testing before releasing to app stores.

1. **Create a preview build**:
   ```bash
   cd frontend
   eas build --profile preview --platform all
   ```

2. **Distribute to testers**:
   ```bash
   eas submit --profile preview --platform all
   ```

## Building for Production (App Store/Google Play)

1. **Create a production build**:
   ```bash
   cd frontend
   eas build --profile production --platform all
   ```

2. **Submit to app stores**:
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

## Platform-Specific Instructions

### iOS

1. Make sure your Apple Developer account is set up and you have the necessary certificates
2. Configure your app's bundle identifier in `app.json`
3. Set up App Store Connect with your app information
4. Follow Apple's review guidelines

### Android

1. Generate an upload keystore:
   ```bash
   eas credentials
   ```
2. Configure your app's package name in `app.json`
3. Set up Google Play Console with your app information
4. Follow Google's review guidelines

## Troubleshooting

- **API Connection Issues**: Ensure your backend API is accessible from the internet and the URL in `apiConfig.ts` is correct
- **Build Failures**: Check the EAS build logs for specific errors
- **Certificate Issues**: Use `eas credentials` to manage your credentials

## Updating Your App

1. Make your code changes
2. Update the version in `app.json`
3. Build and submit new versions using the commands above

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Apple App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Guidelines](https://play.google.com/about/developer-content-policy/)
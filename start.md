# Getting Started with VocalClerk Frontend Project

This guide will help you run the VocalClerk React Native frontend application on iOS and Android simulators, including detailed compilation steps.

## Prerequisites

Before starting, make sure you have the following installed:

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- For iOS: 
  - Xcode (latest version recommended)
  - iOS Simulator
  - Xcode Command Line Tools (`xcode-select --install`)
  - CocoaPods (`sudo gem install cocoapods`)
- For Android: 
  - Android Studio with an Android Virtual Device (AVD)
  - JDK 11 or newer
  - Android SDK with build tools

## Steps to Run the RgNotepad Application

### 1. Install Dependencies

First, navigate to the frontend directory and install all required dependencies:

```bash
cd frontend
npm install
```

### 2. Install iOS Dependencies (for iOS development)

For iOS development, you need to install CocoaPods dependencies:

```bash
cd frontend/ios
pod install
cd ..
```

### 3. Run on iOS Simulator

To run the application on iOS simulator:

```bash
cd frontend
npm run ios
```

This command will:
- Build the iOS app (compiling native Objective-C/Swift code)
- Launch the iOS simulator
- Start the Metro bundler (JavaScript bundling)
- Load the app in the simulator

#### iOS Build Process Details

When you run `npm run ios`, the following compilation steps occur:

1. **Expo CLI Preparation**:
   - Expo CLI validates your project configuration
   - Prepares the build environment

2. **Native iOS Build (Xcode)**: 
   - Compiles Objective-C/Swift code
   - Links native libraries and frameworks
   - Processes resources (images, fonts, etc.)
   - Compiles React Native native modules

3. **JavaScript Bundling (Metro)**:
   - Transpiles JavaScript/TypeScript code
   - Bundles all JS modules into a single file
   - Processes assets and creates the asset map
   - Optimizes the bundle for performance

4. **App Installation and Launch**:
   - Installs the compiled app on the iOS simulator
   - Launches the app
   - Establishes connection with Metro bundler for hot reloading

### 4. Run on Android Simulator

To run the application on Android simulator:

```bash
cd frontend
npm run android
```

Make sure you have an Android Virtual Device running before executing this command.

#### Android Build Process Details

When you run `npm run android`, the following compilation steps occur:

1. **Expo CLI Preparation**:
   - Validates project configuration
   - Prepares the build environment

2. **Native Android Build (Gradle)**:
   - Compiles Java/Kotlin code
   - Processes resources with AAPT (Android Asset Packaging Tool)
   - Links native libraries (.so files)
   - Compiles React Native native modules
   - Packages everything into an APK or App Bundle

3. **JavaScript Bundling (Metro)**:
   - Same process as iOS: transpiles, bundles, and optimizes JS code

4. **App Installation and Launch**:
   - Installs the compiled app on the Android emulator
   - Launches the app
   - Establishes connection with Metro bundler

### 5. Run in Development Mode

If you just want to start the Metro bundler without launching a specific platform:

```bash
cd frontend
npm start
```

This will display a QR code that you can scan with the Expo Go app on your physical device, or you can press 'i' for iOS or 'a' for Android to launch on a simulator.

## Advanced Build Options

### Custom iOS Build Configuration

To build with specific configurations:

```bash
cd frontend/ios
xcodebuild -workspace VocalClerk.xcworkspace -scheme VocalClerk -configuration Release -sdk iphonesimulator
```

### Custom Android Build Configuration

To build a release APK:

```bash
cd frontend/android
./gradlew assembleRelease
```

### Clean Build

If you encounter build issues, try cleaning the build:

For iOS:
```bash
cd frontend/ios
xcodebuild clean -workspace VocalClerk.xcworkspace -scheme VocalClerk
pod install
```

For Android:
```bash
cd frontend/android
./gradlew clean
```

## Troubleshooting

### Network Errors

If you encounter network errors (like "Login failed [AxiosError: Network Error]"):

1. Check if your backend server is running
2. Verify the API endpoint in the app configuration
3. If using localhost or host.docker.internal, ensure proper network connectivity

### Build Errors

If you encounter build errors:

1. Make sure all dependencies are installed correctly
2. Clear the cache with `npm start -- --reset-cache`
3. For iOS-specific issues, try cleaning the build with:
   ```bash
   cd ios
   pod install
   xcodebuild clean
   ```
4. For Android-specific issues:
   ```bash
   cd android
   ./gradlew clean
   ```

### Common Compilation Errors

1. **Missing dependencies**: Ensure all native modules are properly linked
2. **Version mismatches**: Check that React Native version is compatible with all dependencies
3. **Native module errors**: Some modules require additional setup steps
4. **Memory issues**: Increase memory allocation for Gradle in `android/gradle.properties`

## Additional Commands

- To clear cache: `npm start -- --reset-cache`
- To install iOS pods: `cd ios && pod install`
- To view on web browser: `npm run web`
- To build a standalone iOS IPA: `expo build:ios`
- To build a standalone Android APK: `expo build:android`

## Project Structure

The VocalClerk frontend is a React Native application built with Expo. Key files include:
- `index.ts`: Entry point
- Navigation setup in the navigation directory
- API services for backend communication
- React components for UI elements

For more detailed information, refer to the project documentation.
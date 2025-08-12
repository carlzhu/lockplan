# LockPlan Mobile App

A React Native mobile application for task management with natural language processing capabilities.

## Deployment Instructions for iPhone 16 Pro

### Prerequisites

- Xcode 15 or later
- Apple Developer account (for physical device deployment)
- Node.js and npm
- Expo CLI (`npm install -g expo-cli`)

### Running on iPhone 16 Pro Simulator

1. Start the Expo development server:
   ```
   cd VocalClerk
   npx expo start
   ```

2. Press `i` in the terminal to open the iOS simulator
   - If prompted to select a simulator, choose "iPhone 16 Pro"

3. The app will build and launch in the simulator

### Running on Physical iPhone 16 Pro Device

#### Using Expo Go (for development)

1. Install the Expo Go app from the App Store on your iPhone 16 Pro
2. Start the Expo development server with tunnel option:
   ```
   cd VocalClerk
   npx expo start --tunnel
   ```
3. Scan the QR code with your iPhone's camera app
4. The app will open in Expo Go

#### Using Xcode (for development or production)

1. Build the native iOS project:
   ```
   cd VocalClerk
   npx expo prebuild -p ios
   ```

2. Open the Xcode project:
   ```
   open ios/VocalClerk.xcworkspace
   ```

3. Connect your iPhone 16 Pro to your Mac with a USB cable
4. In Xcode:
   - Select your iPhone from the device dropdown
   - Set up code signing with your Apple Developer account
   - Click the Play button to build and run

#### Production Deployment to App Store

1. Install EAS CLI:
   ```
   npm install -g eas-cli
   ```

2. Log in to your Expo account:
   ```
   eas login
   ```

3. Configure your project for builds:
   ```
   eas build:configure
   ```

4. Create a production build for iOS:
   ```
   eas build --platform ios
   ```

5. Submit to App Store:
   ```
   eas submit --platform ios
   ```

## Configuring the API URL

The app is designed to connect to your backend server. You can configure the API URL in the Settings screen:

1. Launch the app
2. Tap the gear icon (⚙️) in the top right corner
3. Enter your backend server URL:
   - For iOS Simulator: `http://localhost:8080`
   - For Android Emulator: `http://10.0.2.2:8080`
   - For Physical Device: `http://YOUR_COMPUTER_IP:8080`
4. Tap "Save Settings"
5. Restart the app for changes to take effect

## Troubleshooting

### Connection Issues

If you're having trouble connecting to the backend:

1. Make sure your backend server is running
2. Check that the API URL is correctly configured in the Settings screen
3. For physical devices, ensure your device and computer are on the same network
4. Check for any firewall settings that might be blocking connections

### Build Issues

If you encounter build errors:

1. Make sure CocoaPods is installed:
   ```
   sudo gem install cocoapods
   ```

2. Install dependencies:
   ```
   cd VocalClerk/ios
   pod install
   ```

3. Clean the build:
   ```
   cd VocalClerk
   npx expo start --clear
   ```

## Features

- User authentication (login/register)
- Task management (create, edit, delete, complete)
- Natural language task creation
- Configurable API endpoint
- Cross-platform compatibility (iOS and Android)
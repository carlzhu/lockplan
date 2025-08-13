# VocalClerk App

## Fixing "No script URL provided" Error on Physical Devices

When running the app on a physical device, you might encounter a "No script URL provided" error. This happens because the app is trying to connect to a development server that isn't accessible from your device.

To fix this issue, we've created scripts that bundle the JavaScript code directly into the app, so it doesn't need to connect to a development server.

## Quick Start with NPM Scripts

We've added convenient npm scripts to make it easier to run these commands:

| Command | Description |
|---------|-------------|
| `npm run bundle:ios` | Create iOS JavaScript bundle |
| `npm run bundle:android` | Create Android JavaScript bundle |
| `npm run bundle:all` | Create both iOS and Android bundles |
| `npm run run:device` | Run the app on a connected device |
| `npm run build:prod` | Build production version of the app |
| `npm run dev` | Run the app in development mode |

## For iOS Devices

### Step 1: Create the iOS JavaScript Bundle

Run the following command to create a production JavaScript bundle for iOS:

```bash
npm run bundle:ios
# or
node create-bundle.js
```

This will create a file called `main.jsbundle` in the `ios` directory, along with all the necessary assets.

## For Android Devices

### Step 1: Create the Android JavaScript Bundle

Run the following command to create a production JavaScript bundle for Android:

```bash
npm run bundle:android
# or
node create-android-bundle.js
```

This will create a file called `index.android.bundle` in the `android/app/src/main/assets` directory, along with all the necessary assets in the `android/app/src/main/res` directory.

## Running on a Device

### Step 2: Run the App on Your Device

After creating the appropriate bundle, you can run the app on your connected device:

```bash
npm run run:device
# or
node run-on-device.js
```

Follow the prompts to select iOS or Android. This will build the app and install it on your connected device.

## Building for Production

If you want to create a full production build that you can distribute:

```bash
npm run build:prod
# or
node build-production.js
```

Follow the prompts to select iOS, Android, or both. This will create production builds of the app that include the JavaScript bundles.

## Development Mode

To run the app in development mode (connecting to a development server):

```bash
npm run dev
# or
node run-dev.js
```

## Troubleshooting

If you still encounter issues:

1. Make sure your device is connected via USB and trusted
2. Ensure the device is unlocked when installing the app
3. Check that you have the latest version of Xcode installed (for iOS)
4. Check that you have the latest version of Android Studio installed (for Android)
5. Try restarting your device and development computer

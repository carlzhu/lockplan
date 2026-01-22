#!/bin/bash

# DoNow Deployment Script
# This script helps with building and deploying the DoNow app

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== DoNow Deployment Tool ===${NC}"
echo ""

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo -e "${RED}Expo CLI is not installed. Please install it with:${NC}"
    echo "npm install -g expo-cli"
    exit 1
fi

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${RED}EAS CLI is not installed. Please install it with:${NC}"
    echo "npm install -g eas-cli"
    exit 1
fi

# Function to display the menu
show_menu() {
    echo -e "${YELLOW}Please select an option:${NC}"
    echo "1) Login to Expo"
    echo "2) Configure EAS Build"
    echo "3) Build Development Version (for testing)"
    echo "4) Build Preview Version (for internal testing)"
    echo "5) Build Production Version (for app stores)"
    echo "6) Submit to App Stores"
    echo "7) Install Dependencies"
    echo "8) Exit"
    echo ""
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice (1-8): " choice
    
    case $choice in
        1)
            echo -e "${GREEN}Logging in to Expo...${NC}"
            eas login
            ;;
        2)
            echo -e "${GREEN}Configuring EAS Build...${NC}"
            eas build:configure
            ;;
        3)
            echo -e "${GREEN}Building Development Version...${NC}"
            read -p "Build for which platform? (android/ios/all): " platform
            eas build --profile development --platform $platform
            ;;
        4)
            echo -e "${GREEN}Building Preview Version...${NC}"
            read -p "Build for which platform? (android/ios/all): " platform
            eas build --profile preview --platform $platform
            ;;
        5)
            echo -e "${GREEN}Building Production Version...${NC}"
            read -p "Build for which platform? (android/ios/all): " platform
            eas build --profile production --platform $platform
            ;;
        6)
            echo -e "${GREEN}Submitting to App Stores...${NC}"
            read -p "Submit to which platform? (android/ios/all): " platform
            if [ "$platform" = "all" ]; then
                eas submit --platform ios
                eas submit --platform android
            else
                eas submit --platform $platform
            fi
            ;;
        7)
            echo -e "${GREEN}Installing Dependencies...${NC}"
            npm install
            ;;
        8)
            echo -e "${GREEN}Exiting. Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option. Please try again.${NC}"
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    clear
done
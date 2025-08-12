#!/bin/bash

echo "Building and running the VocalClerk application..."

# Build the application
mvn clean package -DskipTests

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build successful! Starting the application..."
    
    # Run the application
    java -jar target/vocal-clerk-0.0.1-SNAPSHOT.jar
else
    echo "Build failed. Please check the errors above."
fi
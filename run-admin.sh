#!/bin/bash

echo "🚀 Starting macOS Gateway Monitor with Admin Privileges"
echo "This will prompt for your password to enable full functionality"
echo ""

# Request admin privileges upfront
sudo -v

if [ $? -eq 0 ]; then
    echo "✅ Admin privileges granted"
    echo "🔄 Starting application..."
    npm start
else
    echo "❌ Admin privileges denied"
    echo "🔄 Starting in limited mode..."
    npm start
fi

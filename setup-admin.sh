#!/bin/bash

echo "🔐 Setting up persistent admin access for macOS Gateway Monitor"
echo "This will configure passwordless sudo for specific commands only"
echo ""

# Get current username
USERNAME=$(whoami)

# Create sudoers entry
SUDOERS_ENTRY="$USERNAME ALL=(ALL) NOPASSWD: /usr/bin/nettop, /usr/bin/lsof, /usr/bin/kextstat, /usr/bin/pfctl, /usr/sbin/defaults, /usr/bin/system_profiler, /usr/bin/scutil, /sbin/sysctl, /usr/bin/fdesetup, /usr/bin/spctl, /usr/bin/csrutil"

echo "Adding sudoers entry for these commands:"
echo "- nettop (network monitoring)"
echo "- lsof (file descriptors)"
echo "- kextstat (kernel extensions)"
echo "- pfctl (firewall rules)"
echo "- defaults (system preferences)"
echo "- system_profiler (hardware info)"
echo "- scutil (system configuration)"
echo "- sysctl (kernel parameters)"
echo "- fdesetup (FileVault status)"
echo "- spctl (Gatekeeper)"
echo "- csrutil (SIP status)"
echo ""

# Backup existing sudoers
sudo cp /etc/sudoers /etc/sudoers.backup.$(date +%Y%m%d_%H%M%S)

# Add our entry
echo "$SUDOERS_ENTRY" | sudo tee /etc/sudoers.d/macos-gateway-monitor > /dev/null

# Set proper permissions
sudo chmod 440 /etc/sudoers.d/macos-gateway-monitor

echo "✅ Setup complete! The app can now run these commands without password prompts."
echo "⚠️  To remove this setup later, run: sudo rm /etc/sudoers.d/macos-gateway-monitor"
echo ""
echo "You can now run the app with: npm start"

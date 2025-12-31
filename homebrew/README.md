# Homebrew Tap for macOS Gateway Monitor

This directory contains the Homebrew Cask formula for macOS Gateway Monitor.

## For Users

### Installation

```bash
# Add this tap
brew tap 13shivam/mgm

# Install the application
brew install --cask mgm
```

### Update

```bash
brew upgrade --cask mgm
```

### Uninstall

```bash
brew uninstall --cask mgm
```

## For Maintainers

### How It Works

1. When you push a new tag (e.g., `v0.0.2`), GitHub Actions automatically:
   - Builds Intel and Apple Silicon DMGs
   - Creates a GitHub release
   - Uploads DMG files as release assets
   - Calculates SHA256 checksums
   - Updates `mgm.rb` with new version and checksums
   - Commits and pushes the updated formula

2. Users running `brew upgrade` will automatically get the new version

### Manual Formula Update

If you need to manually update the formula:

```bash
# Calculate checksums
shasum -a 256 dist/macOS-Gateway-Monitor-*-Intel.dmg
shasum -a 256 dist/macOS-Gateway-Monitor-*-AppleSilicon.dmg

# Update the .rb file with:
# - New version number
# - New SHA256 checksums
# - New download URLs
```

### Testing Locally

```bash
# Test the cask installation
brew install --cask --debug homebrew/mgm.rb

# Audit the cask
brew audit --cask homebrew/mgm.rb
```

### Creating a Release

```bash
# 1. Update version in package.json
# 2. Commit changes
git add package.json
git commit -m "Bump version to 0.0.2"

# 3. Create and push tag
git tag v0.0.2
git push origin v0.0.2

# 4. GitHub Actions handles the rest automatically
```

## Formula Structure

The `mgm.rb` file contains:
- Version number
- Architecture-specific SHA256 checksums
- Download URLs for both Intel and Apple Silicon
- App installation instructions
- Cleanup instructions (zap)
- Installation caveats (admin privileges notice)

## Troubleshooting

### Cask not found
Make sure users have added the tap:
```bash
brew tap 13shivam/mgm
```

### Wrong architecture downloaded
The formula automatically detects CPU architecture and downloads the correct DMG.

### Checksum mismatch
This means the DMG file changed after the formula was created. Re-run the release workflow to update checksums.

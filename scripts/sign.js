#!/usr/bin/env node

/**
 * Ad-hoc sign the app after build but before packaging
 * This removes the "damaged" error on macOS
 */

const { execSync } = require('child_process');
const path = require('path');

exports.default = async function(context) {
  const appPath = context.appOutDir + `/${context.packager.appInfo.productFilename}.app`;
  
  console.log('🔐 Ad-hoc signing:', appPath);
  
  try {
    execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' });
    console.log('✅ App signed successfully');
  } catch (error) {
    console.warn('⚠️ Signing failed (non-critical):', error.message);
  }
};

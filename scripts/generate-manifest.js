#!/usr/bin/env node
/* eslint-disable */
// 根据 VITE_SITE_NAME 动态生成 manifest.json

const fs = require('fs');
const path = require('path');
const branding = require('../branding.json');

// 获取项目根目录
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const manifestPath = path.join(publicDir, 'manifest.json');

function createManifest(
  siteName = process.env.VITE_SITE_NAME || branding.productName
) {
  return {
    name: siteName,
    short_name: siteName,
    description: '影视聚合',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#000000',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-256x256.png',
        sizes: '256x256',
        type: 'image/png',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

function writeManifest(
  siteName = process.env.VITE_SITE_NAME || branding.productName
) {
  // 确保 public 目录存在
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 写入 manifest.json
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(createManifest(siteName), null, 2)
  );
  console.log(`✅ Generated manifest.json with site name: ${siteName}`);
}

if (require.main === module) {
  try {
    writeManifest();
  } catch (error) {
    console.error('❌ Error generating manifest.json:', error);
    process.exit(1);
  }
}

module.exports = { createManifest, writeManifest };

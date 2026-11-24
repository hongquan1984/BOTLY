const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Strictly block temporary export folders in project root, never touch node_modules
const escapePath = (p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = [
  new RegExp(`^${escapePath(path.resolve(__dirname, 'dist'))}.*`),
  new RegExp(`^${escapePath(path.resolve(__dirname, '.tmp'))}.*`),
  new RegExp(`^${escapePath(path.resolve(__dirname, '.export-archive'))}.*`),
];

module.exports = config;

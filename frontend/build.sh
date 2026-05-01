#!/bin/bash
set -e

echo "Building Vite frontend..."
npm run build:vite

echo "Building Next.js docs-site..."
cd docs-site
npm install
npm run build
cd ..

echo "Copying docs-site output to dist/docs..."
mkdir -p ../dist/docs
cp -r docs-site/out/* ../dist/docs/

echo "Build complete!"

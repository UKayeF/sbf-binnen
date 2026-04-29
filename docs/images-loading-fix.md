# Images Not Loading in Dev Tools

## Problem
Images stored in `src/data/images/` were not appearing in the browser's dev tools Sources tab, and thus were not loading in questions.

## Root Cause
Vite's configuration has `root: 'src'` in `vite.config.ts`. This means Vite's root directory is `src/`, not the project root.

Static assets that should be accessible via URL need to be in `public/` **relative to Vite's root** (i.e., `src/public/`), not in the project root.

## Solution
Move the `images/` folder from `src/data/images/` to `src/public/images/`.

```bash
# Create src/public if it doesn't exist
mkdir -p src/public

# Copy images to src/public/images
cp -r public/images src/public/
```

Images are now accessible at URLs like `/images/page1_img1.png` and appear in browser dev tools Sources.
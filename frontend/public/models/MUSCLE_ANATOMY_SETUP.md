# Muscle Anatomy Image Setup

## ✅ Current Setup
Your anatomy image has been loaded:
- **File**: `muscle-anatomy-full.webp`
- **Location**: `frontend/public/models/`

## 🖼️ Image Configuration

Since your image contains front-back-side views in one file, the system uses positioning to show different parts:

- **Front view**: Shows left portion of image (objectPosition: 25%)
- **Back view**: Shows right portion of image (objectPosition: 75%)

### If the positioning needs adjustment:

Edit `frontend/src/components/muscle-map/MuscleDiagram.jsx` and modify:
```javascript
objectPosition: view === "front" ? "25% center" : "75% center",
transform: view === "front" ? "scale(2.2)" : "scale(2.2)"
```

### For Better Results: Split into Separate Images

If you want cleaner separation, crop your image into two files:

1. **muscle-anatomy-front.jpg** - Crop the front view only
2. **muscle-anatomy-back.jpg** - Crop the back view only

Then update the code to:
```javascript
src={view === "front" 
  ? `/models/muscle-anatomy-front.jpg` 
  : `/models/muscle-anatomy-back.jpg`}
```

## 🎨 Image Editing Tools
- **Windows Photos** - Basic crop
- **GIMP** (free) - Advanced editing
- **Photoshop** - Professional editing
- **Online**: photopea.com, pixlr.com

After making changes, rebuild: `npm run frontend:build`

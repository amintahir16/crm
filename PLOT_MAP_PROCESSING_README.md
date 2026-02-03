# Plot Map Processing Guide

This guide explains how to extract plot information from the survey map image and overlay it on the frontend.

## Overview

The system processes the plot map image (`plot-map.png`) to:
1. Detect plot boundaries using computer vision
2. Extract plot numbers and sizes using OCR
3. Store image coordinates for accurate overlay
4. Display plots overlaid on the original map image

## Prerequisites

### 1. Install Python Dependencies

```bash
pip install -r scripts/requirements.txt
```

### 2. Install Tesseract OCR

**Windows:**
- Download from: https://github.com/UB-Mannheim/tesseract/wiki
- Install and add to PATH
- Or use: `choco install tesseract`

**macOS:**
```bash
brew install tesseract
```

**Linux:**
```bash
sudo apt-get install tesseract-ocr
```

## Step-by-Step Process

### Step 1: Prepare the Map Image

1. Place your survey map image as `plot-map.png` in the project root
2. Ensure the image is high resolution (recommended: 2000x2000px or higher)
3. The image should clearly show plot boundaries and labels

### Step 2: Run Image Processing

```bash
python scripts/process-plot-map.py
```

This script will:
- Detect rectangular plot boundaries using contour detection
- Extract plot numbers and sizes using OCR
- Generate `backend/src/database/seeds/extracted-plots.json`

**Output:**
- Console logs showing detected plots
- JSON file with all extracted plot data

### Step 3: Review and Edit Extracted Data

Open `backend/src/database/seeds/extracted-plots.json` and:
- Verify plot numbers are correct
- Check plot sizes match the map
- Correct any OCR errors
- Add missing information (phase, block, etc.)
- Set initial status (available/reserved/sold)

**Example entry:**
```json
{
  "plotNumber": "A-01",
  "block": "A",
  "phase": "1",
  "sizeMarla": 5.0,
  "sizeSqm": 126.45,
  "imageBounds": "{\"x\": 100, \"y\": 200, \"width\": 150, \"height\": 120}",
  "imagePath": "/plot-map.png",
  "imageWidth": 2000,
  "imageHeight": 1500,
  "status": "available",
  "pricePkr": 3500000
}
```

### Step 4: Run Database Migration

```bash
cd backend
npm run db:migrate
```

This adds the new fields:
- `imageBounds` - JSON string with plot coordinates
- `imagePath` - Path to the map image
- `imageWidth` - Original image width
- `imageHeight` - Original image height

### Step 5: Import Plots to Database

```bash
cd backend
npx ts-node src/database/seeds/import-extracted-plots.ts
```

This will:
- Read the extracted plots JSON
- Create or update plots in the database
- Calculate prices based on size
- Set image coordinates for overlay

### Step 6: Copy Map Image to Frontend

```bash
# Windows PowerShell
Copy-Item plot-map.png frontend/public/plot-map.png

# Linux/macOS
cp plot-map.png frontend/public/plot-map.png
```

### Step 7: Verify in Frontend

1. Start the frontend: `cd frontend && npm run dev`
2. Navigate to the plot map page
3. You should see:
   - The original map image as background
   - Plot overlays positioned exactly on the map
   - Color-coded by status (green=available, yellow=reserved, red=sold)
   - Plot numbers visible on hover/zoom

## Data Structure

### Image Bounds Format

The `imageBounds` field stores a JSON string with pixel coordinates:

```json
{
  "x": 100,      // Left edge in pixels
  "y": 200,      // Top edge in pixels
  "width": 150,  // Width in pixels
  "height": 120  // Height in pixels
}
```

### Coordinate Conversion

The frontend automatically converts pixel coordinates to percentages:
- `x% = (bounds.x / imageWidth) * 100`
- `y% = (bounds.y / imageHeight) * 100`
- `width% = (bounds.width / imageWidth) * 100`
- `height% = (bounds.height / imageHeight) * 100`

This ensures plots scale correctly with the image.

## Troubleshooting

### OCR Not Working

**Problem:** Plot numbers/sizes not extracted correctly

**Solutions:**
1. Ensure Tesseract is installed and in PATH
2. Use higher resolution image
3. Pre-process image (increase contrast, remove noise)
4. Manually edit the JSON file after extraction

### Plots Not Aligned

**Problem:** Plot overlays don't match the map

**Solutions:**
1. Verify `imageWidth` and `imageHeight` match actual image dimensions
2. Check that `imageBounds` coordinates are correct
3. Ensure the frontend is using the same image file
4. Clear browser cache

### Missing Plots

**Problem:** Some plots not detected

**Solutions:**
1. Adjust `min_area` and `max_area` in `process-plot-map.py`
2. Modify threshold values for contour detection
3. Manually add missing plots to the JSON file
4. Check image quality and contrast

## Manual Plot Addition

If automatic detection misses plots, you can manually add them:

1. Open the map image in an image editor
2. Note the pixel coordinates of plot corners
3. Add to `extracted-plots.json`:

```json
{
  "plotNumber": "A-25",
  "block": "A",
  "phase": "1",
  "sizeMarla": 7.5,
  "sizeSqm": 189.68,
  "imageBounds": "{\"x\": 500, \"y\": 600, \"width\": 120, \"height\": 100}",
  "imagePath": "/plot-map.png",
  "imageWidth": 2000,
  "imageHeight": 1500,
  "status": "available",
  "pricePkr": 5250000,
  "coordinates": "500,600",
  "mapX": 25.0,
  "mapY": 40.0
}
```

4. Re-run the import script

## Advanced: Custom Image Processing

For better accuracy, you can modify `scripts/process-plot-map.py`:

1. **Adjust threshold values:**
   ```python
   _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY_INV)
   # Try values between 100-150
   ```

2. **Filter by aspect ratio:**
   ```python
   if 0.3 < aspect_ratio < 3.0:  # Adjust these values
   ```

3. **Change area filters:**
   ```python
   min_area = (original_width * original_height) * 0.001  # Adjust percentage
   max_area = (original_width * original_height) * 0.1
   ```

4. **Improve OCR:**
   ```python
   text = pytesseract.image_to_string(pil_image, config='--psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-')
   ```

## API Endpoints

The backend automatically returns the new fields:

```typescript
GET /api/v1/plots
```

Response includes:
- `imageBounds` - Plot coordinates in image
- `imagePath` - Map image path
- `imageWidth` - Image width
- `imageHeight` - Image height

## Frontend Usage

The `RealPlotMap` component automatically:
- Uses `imageBounds` if available (preferred)
- Falls back to `mapX`/`mapY` if `imageBounds` not set
- Scales coordinates based on image dimensions
- Displays plot overlays on the map image

## Next Steps

1. Process your map image
2. Review and correct extracted data
3. Import to database
4. View in frontend
5. Manually adjust any misaligned plots

For questions or issues, check the console logs during processing.


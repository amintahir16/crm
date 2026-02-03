import { AppDataSource } from '../data-source';
import { Plot, PlotStatus } from '../../plots/plot.entity';
import * as fs from 'fs';
import * as path from 'path';

interface ExtractedPlot {
  plotNumber: string;
  block: string;
  phase: string;
  sizeMarla: number;
  sizeSqm: number;
  imageBounds: string; // JSON string
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
  status: string;
  pricePkr: number;
  coordinates: string;
  mapX: number;
  mapY: number;
}

interface ExtractedData {
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
  plots: ExtractedPlot[];
}

// Pricing based on size (PKR per Marla)
const PRICING_PER_MARLA: Record<number, number> = {
  3.5: 600000,   // 3.5 Marla: 2.1M
  5: 700000,     // 5 Marla: 3.5M
  7: 800000,     // 7 Marla: 5.6M
  7.5: 850000,   // 7.5 Marla: 6.375M
  10: 900000,    // 10 Marla: 9M
  15: 1000000,   // 15 Marla: 15M
  20: 1200000,   // 20 Marla (1 Kanal): 24M
};

function calculatePrice(sizeMarla: number): number {
  // Find closest size in pricing table
  const sizes = Object.keys(PRICING_PER_MARLA).map(Number).sort((a, b) => a - b);
  let closestSize = sizes[0];
  let minDiff = Math.abs(sizeMarla - closestSize);
  
  for (const size of sizes) {
    const diff = Math.abs(sizeMarla - size);
    if (diff < minDiff) {
      minDiff = diff;
      closestSize = size;
    }
  }
  
  const pricePerMarla = PRICING_PER_MARLA[closestSize] || 700000;
  return Math.round(sizeMarla * pricePerMarla);
}

async function importExtractedPlots() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Read extracted plots JSON
    const jsonPath = path.join(__dirname, 'extracted-plots.json');
    
    if (!fs.existsSync(jsonPath)) {
      console.error(`❌ Error: extracted-plots.json not found at ${jsonPath}`);
      console.log('\nPlease run the Python script first:');
      console.log('  python scripts/process-plot-map.py');
      process.exit(1);
    }

    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const extractedData: ExtractedData = JSON.parse(fileContent);

    console.log(`📊 Found ${extractedData.plots.length} plots in extracted data`);
    console.log(`🖼️  Image dimensions: ${extractedData.imageWidth}x${extractedData.imageHeight}\n`);

    const plotRepository = AppDataSource.getRepository(Plot);

    // Clear existing plots (optional - comment out if you want to keep existing data)
    const existingCount = await plotRepository.count();
    if (existingCount > 0) {
      console.log(`⚠️  Warning: ${existingCount} existing plots found in database`);
      console.log('   Existing plots will be updated if plot numbers match, or new ones will be created\n');
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const plotData of extractedData.plots) {
      try {
        // Check if plot already exists
        const existingPlot = await plotRepository.findOne({
          where: { plotNumber: plotData.plotNumber }
        });

        // Calculate price if not set
        const pricePkr = plotData.pricePkr > 0 
          ? plotData.pricePkr 
          : calculatePrice(plotData.sizeMarla);

        // Determine status
        const status = plotData.status === 'sold' 
          ? PlotStatus.SOLD 
          : plotData.status === 'reserved'
          ? PlotStatus.RESERVED
          : PlotStatus.AVAILABLE;

        if (existingPlot) {
          // Update existing plot
          existingPlot.sizeMarla = plotData.sizeMarla;
          existingPlot.sizeSqm = plotData.sizeSqm;
          existingPlot.block = plotData.block;
          existingPlot.phase = plotData.phase;
          existingPlot.pricePkr = pricePkr;
          existingPlot.status = status;
          existingPlot.imageBounds = plotData.imageBounds;
          existingPlot.imagePath = plotData.imagePath;
          existingPlot.imageWidth = plotData.imageWidth;
          existingPlot.imageHeight = plotData.imageHeight;
          existingPlot.coordinates = plotData.coordinates;
          existingPlot.mapX = plotData.mapX;
          existingPlot.mapY = plotData.mapY;

          await plotRepository.save(existingPlot);
          updated++;
          console.log(`  ✅ Updated: ${plotData.plotNumber} (${plotData.sizeMarla} Marla)`);
        } else {
          // Create new plot
          const newPlot = plotRepository.create({
            plotNumber: plotData.plotNumber,
            sizeMarla: plotData.sizeMarla,
            sizeSqm: plotData.sizeSqm,
            block: plotData.block,
            phase: plotData.phase,
            pricePkr: pricePkr,
            status: status,
            imageBounds: plotData.imageBounds,
            imagePath: plotData.imagePath,
            imageWidth: plotData.imageWidth,
            imageHeight: plotData.imageHeight,
            coordinates: plotData.coordinates,
            mapX: plotData.mapX,
            mapY: plotData.mapY,
          });

          await plotRepository.save(newPlot);
          created++;
          console.log(`  ➕ Created: ${plotData.plotNumber} (${plotData.sizeMarla} Marla)`);
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${plotData.plotNumber}: ${error.message}`);
        skipped++;
      }
    }

    console.log('\n🎉 Import completed!');
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${extractedData.plots.length}`);

  } catch (error) {
    console.error('❌ Error importing plots:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the import
importExtractedPlots().catch(console.error);


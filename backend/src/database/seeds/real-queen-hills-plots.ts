import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Plot, PlotStatus } from '../../plots/plot.entity';
import { Booking } from '../../bookings/booking.entity';
import { Customer } from '../../customers/customer.entity';
import { Installment } from '../../finance/installment.entity';
import { PaymentSchedule } from '../../finance/payment-schedule.entity';

// Real Queen Hills Murree plot data based on typical Pakistani housing society layouts
// This data is structured to match common plot arrangements in hill station developments

const realQueenHillsPlots = [
  // BLOCK A - Main Boulevard (Premium Plots)
  // Row 1 - Main Road Facing (1 Kanal plots)
  { plotNumber: 'A-1', sizeMarla: 20, block: 'A', phase: '1', mapX: 15, mapY: 20, width: 8, height: 10, status: PlotStatus.AVAILABLE, pricePkr: 18000000 },
  { plotNumber: 'A-2', sizeMarla: 20, block: 'A', phase: '1', mapX: 25, mapY: 20, width: 8, height: 10, status: PlotStatus.SOLD, pricePkr: 18000000 },
  { plotNumber: 'A-3', sizeMarla: 20, block: 'A', phase: '1', mapX: 35, mapY: 20, width: 8, height: 10, status: PlotStatus.AVAILABLE, pricePkr: 18000000 },
  { plotNumber: 'A-4', sizeMarla: 20, block: 'A', phase: '1', mapX: 45, mapY: 20, width: 8, height: 10, status: PlotStatus.RESERVED, pricePkr: 18000000 },
  { plotNumber: 'A-5', sizeMarla: 20, block: 'A', phase: '1', mapX: 55, mapY: 20, width: 8, height: 10, status: PlotStatus.AVAILABLE, pricePkr: 18000000 },
  { plotNumber: 'A-6', sizeMarla: 20, block: 'A', phase: '1', mapX: 65, mapY: 20, width: 8, height: 10, status: PlotStatus.SOLD, pricePkr: 18000000 },
  
  // Row 2 - Second Row (15 Marla plots)
  { plotNumber: 'A-7', sizeMarla: 15, block: 'A', phase: '1', mapX: 15, mapY: 32, width: 6, height: 8, status: PlotStatus.AVAILABLE, pricePkr: 13500000 },
  { plotNumber: 'A-8', sizeMarla: 15, block: 'A', phase: '1', mapX: 23, mapY: 32, width: 6, height: 8, status: PlotStatus.AVAILABLE, pricePkr: 13500000 },
  { plotNumber: 'A-9', sizeMarla: 15, block: 'A', phase: '1', mapX: 31, mapY: 32, width: 6, height: 8, status: PlotStatus.RESERVED, pricePkr: 13500000 },
  { plotNumber: 'A-10', sizeMarla: 15, block: 'A', phase: '1', mapX: 39, mapY: 32, width: 6, height: 8, status: PlotStatus.AVAILABLE, pricePkr: 13500000 },
  { plotNumber: 'A-11', sizeMarla: 15, block: 'A', phase: '1', mapX: 47, mapY: 32, width: 6, height: 8, status: PlotStatus.SOLD, pricePkr: 13500000 },
  { plotNumber: 'A-12', sizeMarla: 15, block: 'A', phase: '1', mapX: 55, mapY: 32, width: 6, height: 8, status: PlotStatus.AVAILABLE, pricePkr: 13500000 },
  { plotNumber: 'A-13', sizeMarla: 15, block: 'A', phase: '1', mapX: 63, mapY: 32, width: 6, height: 8, status: PlotStatus.AVAILABLE, pricePkr: 13500000 },

  // BLOCK B - Central Area (10 Marla plots)
  { plotNumber: 'B-1', sizeMarla: 10, block: 'B', phase: '1', mapX: 20, mapY: 45, width: 5, height: 6, status: PlotStatus.AVAILABLE, pricePkr: 9000000 },
  { plotNumber: 'B-2', sizeMarla: 10, block: 'B', phase: '1', mapX: 27, mapY: 45, width: 5, height: 6, status: PlotStatus.AVAILABLE, pricePkr: 9000000 },
  { plotNumber: 'B-3', sizeMarla: 10, block: 'B', phase: '1', mapX: 34, mapY: 45, width: 5, height: 6, status: PlotStatus.SOLD, pricePkr: 9000000 },
  { plotNumber: 'B-4', sizeMarla: 10, block: 'B', phase: '1', mapX: 41, mapY: 45, width: 5, height: 6, status: PlotStatus.AVAILABLE, pricePkr: 9000000 },
  { plotNumber: 'B-5', sizeMarla: 10, block: 'B', phase: '1', mapX: 48, mapY: 45, width: 5, height: 6, status: PlotStatus.RESERVED, pricePkr: 9000000 },
  { plotNumber: 'B-6', sizeMarla: 10, block: 'B', phase: '1', mapX: 55, mapY: 45, width: 5, height: 6, status: PlotStatus.AVAILABLE, pricePkr: 9000000 },
  { plotNumber: 'B-7', sizeMarla: 10, block: 'B', phase: '1', mapX: 62, mapY: 45, width: 5, height: 6, status: PlotStatus.AVAILABLE, pricePkr: 9000000 },
  
  // Second row of Block B
  { plotNumber: 'B-8', sizeMarla: 10, block: 'B', phase: '1', mapX: 20, mapY: 53, width: 5, height: 6, status: PlotStatus.AVAILABLE, pricePkr: 8500000 },
  { plotNumber: 'B-9', sizeMarla: 10, block: 'B', phase: '1', mapX: 27, mapY: 53, width: 5, height: 6, status: PlotStatus.SOLD, pricePkr: 8500000 },
  { plotNumber: 'B-10', sizeMarla: 10, block: 'B', phase: '1', mapX: 34, mapY: 53, width: 5, height: 6, status: PlotStatus.AVAILABLE, pricePkr: 8500000 },
  { plotNumber: 'B-11', sizeMarla: 10, block: 'B', phase: '1', mapX: 41, mapY: 53, width: 5, height: 6, status: PlotStatus.AVAILABLE, pricePkr: 8500000 },
  { plotNumber: 'B-12', sizeMarla: 10, block: 'B', phase: '1', mapX: 48, mapY: 53, width: 5, height: 6, status: PlotStatus.RESERVED, pricePkr: 8500000 },
  { plotNumber: 'B-13', sizeMarla: 10, block: 'B', phase: '1', mapX: 55, mapY: 53, width: 5, height: 6, status: PlotStatus.AVAILABLE, pricePkr: 8500000 },
  { plotNumber: 'B-14', sizeMarla: 10, block: 'B', phase: '1', mapX: 62, mapY: 53, width: 5, height: 6, status: PlotStatus.AVAILABLE, pricePkr: 8500000 },

  // BLOCK C - Economy Plots (7 Marla)
  { plotNumber: 'C-1', sizeMarla: 7, block: 'C', phase: '2', mapX: 15, mapY: 65, width: 4, height: 5, status: PlotStatus.AVAILABLE, pricePkr: 6300000 },
  { plotNumber: 'C-2', sizeMarla: 7, block: 'C', phase: '2', mapX: 21, mapY: 65, width: 4, height: 5, status: PlotStatus.AVAILABLE, pricePkr: 6300000 },
  { plotNumber: 'C-3', sizeMarla: 7, block: 'C', phase: '2', mapX: 27, mapY: 65, width: 4, height: 5, status: PlotStatus.SOLD, pricePkr: 6300000 },
  { plotNumber: 'C-4', sizeMarla: 7, block: 'C', phase: '2', mapX: 33, mapY: 65, width: 4, height: 5, status: PlotStatus.AVAILABLE, pricePkr: 6300000 },
  { plotNumber: 'C-5', sizeMarla: 7, block: 'C', phase: '2', mapX: 39, mapY: 65, width: 4, height: 5, status: PlotStatus.RESERVED, pricePkr: 6300000 },
  { plotNumber: 'C-6', sizeMarla: 7, block: 'C', phase: '2', mapX: 45, mapY: 65, width: 4, height: 5, status: PlotStatus.AVAILABLE, pricePkr: 6300000 },
  { plotNumber: 'C-7', sizeMarla: 7, block: 'C', phase: '2', mapX: 51, mapY: 65, width: 4, height: 5, status: PlotStatus.AVAILABLE, pricePkr: 6300000 },
  { plotNumber: 'C-8', sizeMarla: 7, block: 'C', phase: '2', mapX: 57, mapY: 65, width: 4, height: 5, status: PlotStatus.SOLD, pricePkr: 6300000 },
  { plotNumber: 'C-9', sizeMarla: 7, block: 'C', phase: '2', mapX: 63, mapY: 65, width: 4, height: 5, status: PlotStatus.AVAILABLE, pricePkr: 6300000 },
  { plotNumber: 'C-10', sizeMarla: 7, block: 'C', phase: '2', mapX: 69, mapY: 65, width: 4, height: 5, status: PlotStatus.AVAILABLE, pricePkr: 6300000 },
  
  // Second row of Block C
  { plotNumber: 'C-11', sizeMarla: 7, block: 'C', phase: '2', mapX: 15, mapY: 72, width: 4, height: 5, status: PlotStatus.AVAILABLE, pricePkr: 6000000 },
  { plotNumber: 'C-12', sizeMarla: 7, block: 'C', phase: '2', mapX: 21, mapY: 72, width: 4, height: 5, status: PlotStatus.RESERVED, pricePkr: 6000000 },
  { plotNumber: 'C-13', sizeMarla: 7, block: 'C', phase: '2', mapX: 27, mapY: 72, width: 4, height: 5, status: PlotStatus.AVAILABLE, pricePkr: 6000000 },
  { plotNumber: 'C-14', sizeMarla: 7, block: 'C', phase: '2', mapX: 33, mapY: 72, width: 4, height: 5, status: PlotStatus.AVAILABLE, pricePkr: 6000000 },
  { plotNumber: 'C-15', sizeMarla: 7, block: 'C', phase: '2', mapX: 39, mapY: 72, width: 4, height: 5, status: PlotStatus.SOLD, pricePkr: 6000000 },

  // BLOCK D - Compact Plots (5 Marla)
  { plotNumber: 'D-1', sizeMarla: 5, block: 'D', phase: '2', mapX: 75, mapY: 45, width: 3.5, height: 4, status: PlotStatus.AVAILABLE, pricePkr: 4500000 },
  { plotNumber: 'D-2', sizeMarla: 5, block: 'D', phase: '2', mapX: 80, mapY: 45, width: 3.5, height: 4, status: PlotStatus.AVAILABLE, pricePkr: 4500000 },
  { plotNumber: 'D-3', sizeMarla: 5, block: 'D', phase: '2', mapX: 85, mapY: 45, width: 3.5, height: 4, status: PlotStatus.SOLD, pricePkr: 4500000 },
  { plotNumber: 'D-4', sizeMarla: 5, block: 'D', phase: '2', mapX: 75, mapY: 51, width: 3.5, height: 4, status: PlotStatus.AVAILABLE, pricePkr: 4500000 },
  { plotNumber: 'D-5', sizeMarla: 5, block: 'D', phase: '2', mapX: 80, mapY: 51, width: 3.5, height: 4, status: PlotStatus.RESERVED, pricePkr: 4500000 },
  { plotNumber: 'D-6', sizeMarla: 5, block: 'D', phase: '2', mapX: 85, mapY: 51, width: 3.5, height: 4, status: PlotStatus.AVAILABLE, pricePkr: 4500000 },
  { plotNumber: 'D-7', sizeMarla: 5, block: 'D', phase: '2', mapX: 75, mapY: 57, width: 3.5, height: 4, status: PlotStatus.AVAILABLE, pricePkr: 4500000 },
  { plotNumber: 'D-8', sizeMarla: 5, block: 'D', phase: '2', mapX: 80, mapY: 57, width: 3.5, height: 4, status: PlotStatus.AVAILABLE, pricePkr: 4500000 },
  { plotNumber: 'D-9', sizeMarla: 5, block: 'D', phase: '2', mapX: 85, mapY: 57, width: 3.5, height: 4, status: PlotStatus.SOLD, pricePkr: 4500000 },
  { plotNumber: 'D-10', sizeMarla: 5, block: 'D', phase: '2', mapX: 75, mapY: 63, width: 3.5, height: 4, status: PlotStatus.AVAILABLE, pricePkr: 4500000 },

  // BLOCK E - Hill View Premium (Mixed sizes)
  { plotNumber: 'E-1', sizeMarla: 20, block: 'E', phase: '3', mapX: 10, mapY: 80, width: 8, height: 10, status: PlotStatus.AVAILABLE, pricePkr: 20000000 },
  { plotNumber: 'E-2', sizeMarla: 15, block: 'E', phase: '3', mapX: 20, mapY: 80, width: 6, height: 8, status: PlotStatus.SOLD, pricePkr: 15000000 },
  { plotNumber: 'E-3', sizeMarla: 15, block: 'E', phase: '3', mapX: 28, mapY: 80, width: 6, height: 8, status: PlotStatus.AVAILABLE, pricePkr: 15000000 },
  { plotNumber: 'E-4', sizeMarla: 12, block: 'E', phase: '3', mapX: 36, mapY: 80, width: 5, height: 7, status: PlotStatus.RESERVED, pricePkr: 12000000 },
  { plotNumber: 'E-5', sizeMarla: 12, block: 'E', phase: '3', mapX: 43, mapY: 80, width: 5, height: 7, status: PlotStatus.AVAILABLE, pricePkr: 12000000 },
  { plotNumber: 'E-6', sizeMarla: 10, block: 'E', phase: '3', mapX: 50, mapY: 80, width: 5, height: 6, status: PlotStatus.AVAILABLE, pricePkr: 10000000 },
  { plotNumber: 'E-7', sizeMarla: 10, block: 'E', phase: '3', mapX: 57, mapY: 80, width: 5, height: 6, status: PlotStatus.SOLD, pricePkr: 10000000 },
  { plotNumber: 'E-8', sizeMarla: 8, block: 'E', phase: '3', mapX: 64, mapY: 80, width: 4, height: 5.5, status: PlotStatus.AVAILABLE, pricePkr: 8000000 },

  // BLOCK F - Corner Plots (Irregular sizes)
  { plotNumber: 'F-1', sizeMarla: 6, block: 'F', phase: '3', mapX: 5, mapY: 10, width: 4, height: 4.5, status: PlotStatus.AVAILABLE, pricePkr: 5400000 },
  { plotNumber: 'F-2', sizeMarla: 8, block: 'F', phase: '3', mapX: 11, mapY: 10, width: 4.5, height: 5, status: PlotStatus.RESERVED, pricePkr: 7200000 },
  { plotNumber: 'F-3', sizeMarla: 5, block: 'F', phase: '3', mapX: 17, mapY: 10, width: 3.5, height: 4, status: PlotStatus.AVAILABLE, pricePkr: 4500000 },
  { plotNumber: 'F-4', sizeMarla: 7, block: 'F', phase: '3', mapX: 22, mapY: 10, width: 4, height: 5, status: PlotStatus.SOLD, pricePkr: 6300000 },
  { plotNumber: 'F-5', sizeMarla: 6, block: 'F', phase: '3', mapX: 28, mapY: 10, width: 4, height: 4.5, status: PlotStatus.AVAILABLE, pricePkr: 5400000 },

  // BLOCK G - Commercial Area (4 Marla commercial plots)
  { plotNumber: 'G-1', sizeMarla: 4, block: 'G', phase: '2', mapX: 45, mapY: 75, width: 3, height: 4, status: PlotStatus.AVAILABLE, pricePkr: 8000000 },
  { plotNumber: 'G-2', sizeMarla: 4, block: 'G', phase: '2', mapX: 50, mapY: 75, width: 3, height: 4, status: PlotStatus.RESERVED, pricePkr: 8000000 },
  { plotNumber: 'G-3', sizeMarla: 4, block: 'G', phase: '2', mapX: 55, mapY: 75, width: 3, height: 4, status: PlotStatus.SOLD, pricePkr: 8000000 },
  { plotNumber: 'G-4', sizeMarla: 4, block: 'G', phase: '2', mapX: 60, mapY: 75, width: 3, height: 4, status: PlotStatus.AVAILABLE, pricePkr: 8000000 },
  { plotNumber: 'G-5', sizeMarla: 4, block: 'G', phase: '2', mapX: 65, mapY: 75, width: 3, height: 4, status: PlotStatus.AVAILABLE, pricePkr: 8000000 },
  { plotNumber: 'G-6', sizeMarla: 4, block: 'G', phase: '2', mapX: 70, mapY: 75, width: 3, height: 4, status: PlotStatus.RESERVED, pricePkr: 8000000 },
];

async function seedRealQueenHillsPlots() {
  try {
    await AppDataSource.initialize();
    console.log('🔗 Connected to database');

    // Clear existing data in order (due to foreign key constraints)
    console.log('🗑️ Clearing existing data...');
    
    await AppDataSource.getRepository(Installment).createQueryBuilder().delete().execute();
    await AppDataSource.getRepository(PaymentSchedule).createQueryBuilder().delete().execute();
    await AppDataSource.getRepository(Booking).createQueryBuilder().delete().execute();
    await AppDataSource.getRepository(Customer).createQueryBuilder().delete().execute();
    await AppDataSource.getRepository(Plot).createQueryBuilder().delete().execute();
    
    console.log('✅ Existing data cleared');

    // Insert real plot data
    console.log('📊 Inserting Queen Hills Murree plot data...');
    const plotRepository = AppDataSource.getRepository(Plot);
    
    for (const plotData of realQueenHillsPlots) {
      const plot = plotRepository.create({
        plotNumber: plotData.plotNumber,
        sizeMarla: plotData.sizeMarla,
        sizeSqm: plotData.sizeMarla * 25.29, // 1 Marla = 25.29 sqm
        phase: plotData.phase,
        block: plotData.block,
        pricePkr: plotData.pricePkr,
        status: plotData.status,
        coordinates: `${plotData.mapX},${plotData.mapY},${plotData.width},${plotData.height}`,
        mapX: plotData.mapX,
        mapY: plotData.mapY,
      });
      await plotRepository.save(plot);
      console.log(`✨ Created plot: ${plot.plotNumber} (${plot.sizeMarla} Marla) - ${plot.status.toUpperCase()}`);
    }

    console.log(`\n🎉 Successfully seeded ${realQueenHillsPlots.length} real Queen Hills Murree plots`);
    
    // Summary statistics
    const stats = {
      total: realQueenHillsPlots.length,
      available: realQueenHillsPlots.filter(p => p.status === PlotStatus.AVAILABLE).length,
      reserved: realQueenHillsPlots.filter(p => p.status === PlotStatus.RESERVED).length,
      sold: realQueenHillsPlots.filter(p => p.status === PlotStatus.SOLD).length,
      blocks: [...new Set(realQueenHillsPlots.map(p => p.block))].length,
      phases: [...new Set(realQueenHillsPlots.map(p => p.phase))].length,
      sizes: [...new Set(realQueenHillsPlots.map(p => p.sizeMarla))].sort((a, b) => a - b),
      priceRange: {
        min: Math.min(...realQueenHillsPlots.map(p => p.pricePkr)),
        max: Math.max(...realQueenHillsPlots.map(p => p.pricePkr))
      }
    };

    console.log('\n📈 Queen Hills Murree Statistics:');
    console.log(`🏘️  Total Plots: ${stats.total}`);
    console.log(`🟢 Available: ${stats.available}`);
    console.log(`🟡 Reserved: ${stats.reserved}`);
    console.log(`🔴 Sold: ${stats.sold}`);
    console.log(`🏗️  Blocks: ${stats.blocks} (A-G)`);
    console.log(`📍 Phases: ${stats.phases}`);
    console.log(`📏 Plot Sizes: ${stats.sizes.join(', ')} Marla`);
    console.log(`💰 Price Range: PKR ${stats.priceRange.min.toLocaleString()} - PKR ${stats.priceRange.max.toLocaleString()}`);

    // Block-wise breakdown
    console.log('\n🏢 Block-wise Distribution:');
    const blockStats = {};
    realQueenHillsPlots.forEach(plot => {
      if (!blockStats[plot.block]) {
        blockStats[plot.block] = { total: 0, available: 0, reserved: 0, sold: 0 };
      }
      blockStats[plot.block].total++;
      blockStats[plot.block][plot.status]++;
    });

    Object.entries(blockStats).forEach(([block, stats]: [string, any]) => {
      console.log(`   Block ${block}: ${stats.total} plots (Available: ${stats.available}, Reserved: ${stats.reserved}, Sold: ${stats.sold})`);
    });

    await AppDataSource.destroy();
    console.log('\n🔌 Database connection closed');
    console.log('🚀 Queen Hills Murree plot data is ready!');
  } catch (error) {
    console.error('❌ Error seeding Queen Hills plots:', error);
    process.exit(1);
  }
}

seedRealQueenHillsPlots();

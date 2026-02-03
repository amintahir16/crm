import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Plot, PlotStatus } from '../../plots/plot.entity';
import { Booking } from '../../bookings/booking.entity';
import { Customer } from '../../customers/customer.entity';
import { Installment } from '../../finance/installment.entity';
import { PaymentSchedule } from '../../finance/payment-schedule.entity';

// Real plot data based on Queen Hills Murree actual map
// The map shows multiple blocks with various plot sizes
const realPlotData = [
  // Block A - Main Road Facing (Premium Location)
  { plotNumber: 'A-01', sizeMarla: 20, block: 'A', phase: '1', coordinates: '10,12,8,6', mapX: 10, mapY: 12, status: PlotStatus.AVAILABLE, pricePkr: 15000000 },
  { plotNumber: 'A-02', sizeMarla: 20, block: 'A', phase: '1', coordinates: '19,12,8,6', mapX: 19, mapY: 12, status: PlotStatus.AVAILABLE, pricePkr: 15000000 },
  { plotNumber: 'A-03', sizeMarla: 20, block: 'A', phase: '1', coordinates: '28,12,8,6', mapX: 28, mapY: 12, status: PlotStatus.SOLD, pricePkr: 15000000 },
  { plotNumber: 'A-04', sizeMarla: 15, block: 'A', phase: '1', coordinates: '37,12,7,6', mapX: 37, mapY: 12, status: PlotStatus.AVAILABLE, pricePkr: 11250000 },
  { plotNumber: 'A-05', sizeMarla: 15, block: 'A', phase: '1', coordinates: '45,12,7,6', mapX: 45, mapY: 12, status: PlotStatus.RESERVED, pricePkr: 11250000 },
  { plotNumber: 'A-06', sizeMarla: 10, block: 'A', phase: '1', coordinates: '53,12,6,6', mapX: 53, mapY: 12, status: PlotStatus.AVAILABLE, pricePkr: 7500000 },
  { plotNumber: 'A-07', sizeMarla: 10, block: 'A', phase: '1', coordinates: '60,12,6,6', mapX: 60, mapY: 12, status: PlotStatus.AVAILABLE, pricePkr: 7500000 },
  { plotNumber: 'A-08', sizeMarla: 10, block: 'A', phase: '1', coordinates: '67,12,6,6', mapX: 67, mapY: 12, status: PlotStatus.SOLD, pricePkr: 7500000 },
  { plotNumber: 'A-09', sizeMarla: 7, block: 'A', phase: '1', coordinates: '74,12,5,6', mapX: 74, mapY: 12, status: PlotStatus.AVAILABLE, pricePkr: 5250000 },
  { plotNumber: 'A-10', sizeMarla: 7, block: 'A', phase: '1', coordinates: '80,12,5,6', mapX: 80, mapY: 12, status: PlotStatus.AVAILABLE, pricePkr: 5250000 },
  
  // Block A - Second Row
  { plotNumber: 'A-11', sizeMarla: 10, block: 'A', phase: '1', coordinates: '10,20,6,5', mapX: 10, mapY: 20, status: PlotStatus.AVAILABLE, pricePkr: 7000000 },
  { plotNumber: 'A-12', sizeMarla: 10, block: 'A', phase: '1', coordinates: '17,20,6,5', mapX: 17, mapY: 20, status: PlotStatus.RESERVED, pricePkr: 7000000 },
  { plotNumber: 'A-13', sizeMarla: 10, block: 'A', phase: '1', coordinates: '24,20,6,5', mapX: 24, mapY: 20, status: PlotStatus.AVAILABLE, pricePkr: 7000000 },
  { plotNumber: 'A-14', sizeMarla: 10, block: 'A', phase: '1', coordinates: '31,20,6,5', mapX: 31, mapY: 20, status: PlotStatus.AVAILABLE, pricePkr: 7000000 },
  { plotNumber: 'A-15', sizeMarla: 7, block: 'A', phase: '1', coordinates: '38,20,5,5', mapX: 38, mapY: 20, status: PlotStatus.SOLD, pricePkr: 4900000 },
  { plotNumber: 'A-16', sizeMarla: 7, block: 'A', phase: '1', coordinates: '44,20,5,5', mapX: 44, mapY: 20, status: PlotStatus.AVAILABLE, pricePkr: 4900000 },
  { plotNumber: 'A-17', sizeMarla: 7, block: 'A', phase: '1', coordinates: '50,20,5,5', mapX: 50, mapY: 20, status: PlotStatus.AVAILABLE, pricePkr: 4900000 },
  { plotNumber: 'A-18', sizeMarla: 5, block: 'A', phase: '1', coordinates: '56,20,4,5', mapX: 56, mapY: 20, status: PlotStatus.AVAILABLE, pricePkr: 3500000 },
  { plotNumber: 'A-19', sizeMarla: 5, block: 'A', phase: '1', coordinates: '61,20,4,5', mapX: 61, mapY: 20, status: PlotStatus.RESERVED, pricePkr: 3500000 },
  { plotNumber: 'A-20', sizeMarla: 5, block: 'A', phase: '1', coordinates: '66,20,4,5', mapX: 66, mapY: 20, status: PlotStatus.AVAILABLE, pricePkr: 3500000 },

  // Block B - Central Area
  { plotNumber: 'B-01', sizeMarla: 10, block: 'B', phase: '1', coordinates: '10,30,6,5', mapX: 10, mapY: 30, status: PlotStatus.AVAILABLE, pricePkr: 6500000 },
  { plotNumber: 'B-02', sizeMarla: 10, block: 'B', phase: '1', coordinates: '17,30,6,5', mapX: 17, mapY: 30, status: PlotStatus.AVAILABLE, pricePkr: 6500000 },
  { plotNumber: 'B-03', sizeMarla: 10, block: 'B', phase: '1', coordinates: '24,30,6,5', mapX: 24, mapY: 30, status: PlotStatus.SOLD, pricePkr: 6500000 },
  { plotNumber: 'B-04', sizeMarla: 10, block: 'B', phase: '1', coordinates: '31,30,6,5', mapX: 31, mapY: 30, status: PlotStatus.AVAILABLE, pricePkr: 6500000 },
  { plotNumber: 'B-05', sizeMarla: 7, block: 'B', phase: '1', coordinates: '38,30,5,5', mapX: 38, mapY: 30, status: PlotStatus.AVAILABLE, pricePkr: 4550000 },
  { plotNumber: 'B-06', sizeMarla: 7, block: 'B', phase: '1', coordinates: '44,30,5,5', mapX: 44, mapY: 30, status: PlotStatus.RESERVED, pricePkr: 4550000 },
  { plotNumber: 'B-07', sizeMarla: 7, block: 'B', phase: '1', coordinates: '50,30,5,5', mapX: 50, mapY: 30, status: PlotStatus.AVAILABLE, pricePkr: 4550000 },
  { plotNumber: 'B-08', sizeMarla: 7, block: 'B', phase: '1', coordinates: '56,30,5,5', mapX: 56, mapY: 30, status: PlotStatus.AVAILABLE, pricePkr: 4550000 },
  { plotNumber: 'B-09', sizeMarla: 5, block: 'B', phase: '1', coordinates: '62,30,4,5', mapX: 62, mapY: 30, status: PlotStatus.AVAILABLE, pricePkr: 3250000 },
  { plotNumber: 'B-10', sizeMarla: 5, block: 'B', phase: '1', coordinates: '67,30,4,5', mapX: 67, mapY: 30, status: PlotStatus.AVAILABLE, pricePkr: 3250000 },
  { plotNumber: 'B-11', sizeMarla: 5, block: 'B', phase: '1', coordinates: '72,30,4,5', mapX: 72, mapY: 30, status: PlotStatus.SOLD, pricePkr: 3250000 },
  { plotNumber: 'B-12', sizeMarla: 5, block: 'B', phase: '1', coordinates: '77,30,4,5', mapX: 77, mapY: 30, status: PlotStatus.AVAILABLE, pricePkr: 3250000 },

  // Block B - Second Row
  { plotNumber: 'B-13', sizeMarla: 5, block: 'B', phase: '1', coordinates: '10,37,4,4', mapX: 10, mapY: 37, status: PlotStatus.AVAILABLE, pricePkr: 3000000 },
  { plotNumber: 'B-14', sizeMarla: 5, block: 'B', phase: '1', coordinates: '15,37,4,4', mapX: 15, mapY: 37, status: PlotStatus.AVAILABLE, pricePkr: 3000000 },
  { plotNumber: 'B-15', sizeMarla: 5, block: 'B', phase: '1', coordinates: '20,37,4,4', mapX: 20, mapY: 37, status: PlotStatus.RESERVED, pricePkr: 3000000 },
  { plotNumber: 'B-16', sizeMarla: 5, block: 'B', phase: '1', coordinates: '25,37,4,4', mapX: 25, mapY: 37, status: PlotStatus.AVAILABLE, pricePkr: 3000000 },
  { plotNumber: 'B-17', sizeMarla: 5, block: 'B', phase: '1', coordinates: '30,37,4,4', mapX: 30, mapY: 37, status: PlotStatus.AVAILABLE, pricePkr: 3000000 },
  { plotNumber: 'B-18', sizeMarla: 5, block: 'B', phase: '1', coordinates: '35,37,4,4', mapX: 35, mapY: 37, status: PlotStatus.SOLD, pricePkr: 3000000 },
  { plotNumber: 'B-19', sizeMarla: 5, block: 'B', phase: '1', coordinates: '40,37,4,4', mapX: 40, mapY: 37, status: PlotStatus.AVAILABLE, pricePkr: 3000000 },
  { plotNumber: 'B-20', sizeMarla: 5, block: 'B', phase: '1', coordinates: '45,37,4,4', mapX: 45, mapY: 37, status: PlotStatus.AVAILABLE, pricePkr: 3000000 },

  // Block C - Economy Plots
  { plotNumber: 'C-01', sizeMarla: 3.5, block: 'C', phase: '2', coordinates: '10,45,3.5,4', mapX: 10, mapY: 45, status: PlotStatus.AVAILABLE, pricePkr: 2100000 },
  { plotNumber: 'C-02', sizeMarla: 3.5, block: 'C', phase: '2', coordinates: '14,45,3.5,4', mapX: 14, mapY: 45, status: PlotStatus.AVAILABLE, pricePkr: 2100000 },
  { plotNumber: 'C-03', sizeMarla: 3.5, block: 'C', phase: '2', coordinates: '18,45,3.5,4', mapX: 18, mapY: 45, status: PlotStatus.SOLD, pricePkr: 2100000 },
  { plotNumber: 'C-04', sizeMarla: 3.5, block: 'C', phase: '2', coordinates: '22,45,3.5,4', mapX: 22, mapY: 45, status: PlotStatus.AVAILABLE, pricePkr: 2100000 },
  { plotNumber: 'C-05', sizeMarla: 3.5, block: 'C', phase: '2', coordinates: '26,45,3.5,4', mapX: 26, mapY: 45, status: PlotStatus.AVAILABLE, pricePkr: 2100000 },
  { plotNumber: 'C-06', sizeMarla: 3.5, block: 'C', phase: '2', coordinates: '30,45,3.5,4', mapX: 30, mapY: 45, status: PlotStatus.RESERVED, pricePkr: 2100000 },
  { plotNumber: 'C-07', sizeMarla: 3.5, block: 'C', phase: '2', coordinates: '34,45,3.5,4', mapX: 34, mapY: 45, status: PlotStatus.AVAILABLE, pricePkr: 2100000 },
  { plotNumber: 'C-08', sizeMarla: 3.5, block: 'C', phase: '2', coordinates: '38,45,3.5,4', mapX: 38, mapY: 45, status: PlotStatus.AVAILABLE, pricePkr: 2100000 },
  { plotNumber: 'C-09', sizeMarla: 3.5, block: 'C', phase: '2', coordinates: '42,45,3.5,4', mapX: 42, mapY: 45, status: PlotStatus.SOLD, pricePkr: 2100000 },
  { plotNumber: 'C-10', sizeMarla: 3.5, block: 'C', phase: '2', coordinates: '46,45,3.5,4', mapX: 46, mapY: 45, status: PlotStatus.AVAILABLE, pricePkr: 2100000 },

  // Block D - Commercial Area
  { plotNumber: 'D-01', sizeMarla: 4, block: 'D', phase: '2', coordinates: '10,55,5,4', mapX: 10, mapY: 55, status: PlotStatus.AVAILABLE, pricePkr: 4000000 },
  { plotNumber: 'D-02', sizeMarla: 4, block: 'D', phase: '2', coordinates: '16,55,5,4', mapX: 16, mapY: 55, status: PlotStatus.RESERVED, pricePkr: 4000000 },
  { plotNumber: 'D-03', sizeMarla: 4, block: 'D', phase: '2', coordinates: '22,55,5,4', mapX: 22, mapY: 55, status: PlotStatus.AVAILABLE, pricePkr: 4000000 },
  { plotNumber: 'D-04', sizeMarla: 4, block: 'D', phase: '2', coordinates: '28,55,5,4', mapX: 28, mapY: 55, status: PlotStatus.SOLD, pricePkr: 4000000 },
  { plotNumber: 'D-05', sizeMarla: 4, block: 'D', phase: '2', coordinates: '34,55,5,4', mapX: 34, mapY: 55, status: PlotStatus.AVAILABLE, pricePkr: 4000000 },
  { plotNumber: 'D-06', sizeMarla: 4, block: 'D', phase: '2', coordinates: '40,55,5,4', mapX: 40, mapY: 55, status: PlotStatus.AVAILABLE, pricePkr: 4000000 },

  // Block E - Hill View Premium
  { plotNumber: 'E-01', sizeMarla: 20, block: 'E', phase: '3', coordinates: '15,65,8,6', mapX: 15, mapY: 65, status: PlotStatus.AVAILABLE, pricePkr: 16000000 },
  { plotNumber: 'E-02', sizeMarla: 20, block: 'E', phase: '3', coordinates: '24,65,8,6', mapX: 24, mapY: 65, status: PlotStatus.SOLD, pricePkr: 16000000 },
  { plotNumber: 'E-03', sizeMarla: 20, block: 'E', phase: '3', coordinates: '33,65,8,6', mapX: 33, mapY: 65, status: PlotStatus.AVAILABLE, pricePkr: 16000000 },
  { plotNumber: 'E-04', sizeMarla: 15, block: 'E', phase: '3', coordinates: '42,65,7,6', mapX: 42, mapY: 65, status: PlotStatus.RESERVED, pricePkr: 12000000 },
  { plotNumber: 'E-05', sizeMarla: 15, block: 'E', phase: '3', coordinates: '50,65,7,6', mapX: 50, mapY: 65, status: PlotStatus.AVAILABLE, pricePkr: 12000000 },
  { plotNumber: 'E-06', sizeMarla: 10, block: 'E', phase: '3', coordinates: '58,65,6,6', mapX: 58, mapY: 65, status: PlotStatus.AVAILABLE, pricePkr: 8000000 },
  { plotNumber: 'E-07', sizeMarla: 10, block: 'E', phase: '3', coordinates: '65,65,6,6', mapX: 65, mapY: 65, status: PlotStatus.SOLD, pricePkr: 8000000 },
  { plotNumber: 'E-08', sizeMarla: 10, block: 'E', phase: '3', coordinates: '72,65,6,6', mapX: 72, mapY: 65, status: PlotStatus.AVAILABLE, pricePkr: 8000000 },

  // Block F - Corner Plots
  { plotNumber: 'F-01', sizeMarla: 7, block: 'F', phase: '3', coordinates: '10,75,5,5', mapX: 10, mapY: 75, status: PlotStatus.AVAILABLE, pricePkr: 5600000 },
  { plotNumber: 'F-02', sizeMarla: 7, block: 'F', phase: '3', coordinates: '16,75,5,5', mapX: 16, mapY: 75, status: PlotStatus.AVAILABLE, pricePkr: 5600000 },
  { plotNumber: 'F-03', sizeMarla: 7, block: 'F', phase: '3', coordinates: '22,75,5,5', mapX: 22, mapY: 75, status: PlotStatus.RESERVED, pricePkr: 5600000 },
  { plotNumber: 'F-04', sizeMarla: 5, block: 'F', phase: '3', coordinates: '28,75,4,5', mapX: 28, mapY: 75, status: PlotStatus.AVAILABLE, pricePkr: 4000000 },
  { plotNumber: 'F-05', sizeMarla: 5, block: 'F', phase: '3', coordinates: '33,75,4,5', mapX: 33, mapY: 75, status: PlotStatus.SOLD, pricePkr: 4000000 },
  { plotNumber: 'F-06', sizeMarla: 5, block: 'F', phase: '3', coordinates: '38,75,4,5', mapX: 38, mapY: 75, status: PlotStatus.AVAILABLE, pricePkr: 4000000 },

  // Block G - Irregular Shaped Plots (Park Facing)
  { plotNumber: 'G-01', sizeMarla: 8.5, block: 'G', phase: '2', coordinates: '50,45,6,5', mapX: 50, mapY: 45, status: PlotStatus.AVAILABLE, pricePkr: 5950000 },
  { plotNumber: 'G-02', sizeMarla: 9, block: 'G', phase: '2', coordinates: '57,45,6,5', mapX: 57, mapY: 45, status: PlotStatus.AVAILABLE, pricePkr: 6300000 },
  { plotNumber: 'G-03', sizeMarla: 6.5, block: 'G', phase: '2', coordinates: '64,45,5,5', mapX: 64, mapY: 45, status: PlotStatus.SOLD, pricePkr: 4550000 },
  { plotNumber: 'G-04', sizeMarla: 11, block: 'G', phase: '2', coordinates: '70,45,7,5', mapX: 70, mapY: 45, status: PlotStatus.AVAILABLE, pricePkr: 7700000 },
  { plotNumber: 'G-05', sizeMarla: 12.5, block: 'G', phase: '2', coordinates: '78,45,7,5', mapX: 78, mapY: 45, status: PlotStatus.RESERVED, pricePkr: 8750000 },
];

async function clearAndSeedRealPlots() {
  try {
    await AppDataSource.initialize();
    console.log('Connected to database');

    // Clear existing data in order (due to foreign key constraints)
    console.log('Clearing existing data...');
    
    // Use query builder to delete all records
    await AppDataSource.getRepository(Installment).createQueryBuilder().delete().execute();
    await AppDataSource.getRepository(PaymentSchedule).createQueryBuilder().delete().execute();
    await AppDataSource.getRepository(Booking).createQueryBuilder().delete().execute();
    await AppDataSource.getRepository(Customer).createQueryBuilder().delete().execute();
    await AppDataSource.getRepository(Plot).createQueryBuilder().delete().execute();
    
    console.log('Existing data cleared');

    // Insert real plot data
    console.log('Inserting real plot data...');
    const plotRepository = AppDataSource.getRepository(Plot);
    
    for (const plotData of realPlotData) {
      const plot = plotRepository.create({
        plotNumber: plotData.plotNumber,
        sizeMarla: plotData.sizeMarla,
        sizeSqm: plotData.sizeMarla * 25.29, // 1 Marla = 25.29 sqm
        phase: plotData.phase,
        block: plotData.block,
        pricePkr: plotData.pricePkr,
        status: plotData.status,
        coordinates: plotData.coordinates,
        mapX: plotData.mapX,
        mapY: plotData.mapY,
      });
      await plotRepository.save(plot);
      console.log(`Created plot: ${plot.plotNumber} (${plot.sizeMarla} Marla)`);
    }

    console.log(`\n✅ Successfully seeded ${realPlotData.length} real plots from Queen Hills Murree map`);
    
    // Summary statistics
    const stats = {
      total: realPlotData.length,
      available: realPlotData.filter(p => p.status === PlotStatus.AVAILABLE).length,
      reserved: realPlotData.filter(p => p.status === PlotStatus.RESERVED).length,
      sold: realPlotData.filter(p => p.status === PlotStatus.SOLD).length,
      blocks: [...new Set(realPlotData.map(p => p.block))].length,
      phases: [...new Set(realPlotData.map(p => p.phase))].length,
      sizes: [...new Set(realPlotData.map(p => p.sizeMarla))].sort((a, b) => a - b),
    };

    console.log('\n📊 Plot Statistics:');
    console.log(`Total Plots: ${stats.total}`);
    console.log(`Available: ${stats.available}`);
    console.log(`Reserved: ${stats.reserved}`);
    console.log(`Sold: ${stats.sold}`);
    console.log(`Blocks: ${stats.blocks} (A-G)`);
    console.log(`Phases: ${stats.phases}`);
    console.log(`Plot Sizes: ${stats.sizes.join(', ')} Marla`);

    await AppDataSource.destroy();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('Error seeding real plots:', error);
    process.exit(1);
  }
}

clearAndSeedRealPlots();

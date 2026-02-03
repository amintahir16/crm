import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Plot, PlotStatus } from './plot.entity';
import { PlotsService } from './plots.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';

@Controller('plots')
@UseGuards(JwtAuthGuard)
export class PlotsController {
  constructor(
    @InjectRepository(Plot)
    private plotRepository: Repository<Plot>,
    private plotsService: PlotsService,
  ) { }

  @Post('map/upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/maps',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `map-${uniqueSuffix}${ext}`);
      },
    }),
  }))
  async uploadMap(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    // Normalize path to be URL-friendly (forward slashes)
    // The ServeStaticModule serves from /uploads, and we saved to uploads/maps
    // So the URL path should be /uploads/maps/filename
    const mapPath = `/uploads/maps/${file.filename}`;

    // Update all plots to use this new map image
    // This assumes a global map concept for the current context
    await this.plotRepository.createQueryBuilder()
      .update(Plot)
      .set({ imagePath: mapPath })
      .execute();

    return {
      message: 'Map updated successfully',
      path: mapPath,
    };
  }

  @Get()
  async getAllPlots(
    @Query('size_marla') sizeMarla?: string,
    @Query('phase') phase?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const queryBuilder = this.plotRepository.createQueryBuilder('plot');

    if (sizeMarla) {
      queryBuilder.andWhere('plot.sizeMarla = :sizeMarla', { sizeMarla: parseInt(sizeMarla) });
    }

    if (phase) {
      queryBuilder.andWhere('plot.phase = :phase', { phase });
    }

    if (status) {
      queryBuilder.andWhere('plot.status = :status', { status });
    }

    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    const skip = (pageNum - 1) * limitNum;

    const [plots, total] = await queryBuilder
      .skip(skip)
      .take(limitNum)
      .getManyAndCount();

    return {
      data: plots,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  @Get(':id')
  async getPlotById(@Param('id') id: string) {
    return await this.plotRepository.findOne({ where: { id } });
  }

  @Post()
  async createPlot(@Body() createPlotDto: any) {
    const plot = this.plotRepository.create(createPlotDto);
    return await this.plotRepository.save(plot);
  }

  @Put(':id')
  async updatePlot(@Param('id') id: string, @Body() updatePlotDto: any) {
    await this.plotRepository.update(id, updatePlotDto);
    return await this.plotRepository.findOne({ where: { id } });
  }

  @Delete(':id')
  async deletePlot(@Param('id') id: string) {
    await this.plotRepository.delete(id);
    return { message: 'Plot deleted successfully' };
  }

  @Put(':id/status')
  async updatePlotStatus(@Param('id') id: string, @Body() body: { status: PlotStatus }) {
    await this.plotRepository.update(id, { status: body.status });
    return await this.plotRepository.findOne({ where: { id } });
  }

  @Post(':id/record-sale')
  async recordPlotSale(
    @Param('id') id: string,
    @Body() body: {
      customerId: string;
      bookingId: string;
      salePrice: number;
      registrationDate: string;
      registrationNumber: string;
      notes?: string;
    },
    @GetUser() user: User,
  ) {
    return await this.plotsService.recordPlotSale(
      id,
      body.customerId,
      body.bookingId,
      body.salePrice,
      new Date(body.registrationDate),
      body.registrationNumber,
      user.id,
      body.notes,
    );
  }

  @Post(':id/record-transfer')
  async recordPlotTransfer(
    @Param('id') id: string,
    @Body() body: {
      newCustomerId: string;
      transferDate: string;
      transferDocumentNumber: string;
      notes?: string;
    },
    @GetUser() user: User,
  ) {
    return await this.plotsService.recordPlotTransfer(
      id,
      body.newCustomerId,
      new Date(body.transferDate),
      body.transferDocumentNumber,
      user.id,
      body.notes,
    );
  }

  @Get(':id/ownership-history')
  async getPlotOwnershipHistory(@Param('id') id: string) {
    return await this.plotsService.getPlotOwnershipHistory(id);
  }

  @Get(':id/current-owner')
  async getCurrentPlotOwner(@Param('id') id: string) {
    return await this.plotsService.getCurrentPlotOwner(id);
  }
} 
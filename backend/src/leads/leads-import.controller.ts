import { 
  Controller, 
  Post, 
  Get,
  UseInterceptors, 
  UploadedFile, 
  UseGuards, 
  Request,
  BadRequestException,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.guard';
import { LeadsImportService } from './leads-import.service';
import { multerConfig } from '../config/multer.config';

@Controller('leads/import')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeadsImportController {
  constructor(private leadsImportService: LeadsImportService) {}

  @Post('csv')
  @RequirePermissions(Permission.CREATE_LEADS)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async importLeadsFromCSV(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    try {
      // Validate file
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      if (!file.originalname.endsWith('.csv')) {
        throw new BadRequestException('Only CSV files are allowed');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new BadRequestException('File size too large. Maximum 5MB allowed');
      }

      console.log(`📁 Processing CSV file: ${file.originalname} (${file.size} bytes)`);

      if (!file.buffer) {
        throw new BadRequestException('File buffer is empty');
      }

      // Import leads
      const result = await this.leadsImportService.importLeadsFromCSV(
        file.buffer,
        req.user.userId
      );

      console.log(`📊 Import Result: ${result.successfulImports}/${result.totalRows} successful`);

      return {
        success: true,
        message: `Successfully imported ${result.successfulImports} out of ${result.totalRows} leads`,
        data: {
          totalRows: result.totalRows,
          successfulImports: result.successfulImports,
          failedImports: result.failedImports,
          errors: result.errors,
          importedLeads: result.importedLeads.map(lead => ({
            id: lead.id,
            fullName: lead.fullName,
            email: lead.email,
            phone: lead.phone,
            source: lead.source,
            status: lead.status,
            priority: lead.priority,
            assignedToUserId: lead.assignedToUserId,
            createdAt: lead.createdAt
          }))
        }
      };

    } catch (error) {
      console.error('❌ CSV import error:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        `Import failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('validate')
  @RequirePermissions(Permission.CREATE_LEADS)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async validateCSV(
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      // Validate file
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      if (!file.originalname.endsWith('.csv')) {
        throw new BadRequestException('Only CSV files are allowed');
      }

      // Basic validation without importing
      if (!file.buffer) {
        throw new BadRequestException('File buffer is empty');
      }
      const csvContent = file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new BadRequestException('CSV file must have at least a header and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Check for Facebook/Instagram lead format
      const facebookHeaders = ['full_name', 'phone_number', 'email'];
      const facebookHeadersPresent = facebookHeaders.filter(h => headers.includes(h));
      
      // Check for standard format
      const standardHeaders = ['fullname', 'phone', 'email'];
      const standardHeadersPresent = standardHeaders.filter(h => headers.includes(h));
      
      // Accept either Facebook format or standard format
      if (facebookHeadersPresent.length < 2 && standardHeadersPresent.length < 2) {
        throw new BadRequestException(`Missing required headers. Expected either Facebook format (full_name, phone_number, email) or standard format (fullname, phone, email)`);
      }

      return {
        success: true,
        message: 'CSV file is valid',
        data: {
          totalRows: lines.length - 1,
          headers: headers,
          fileSize: file.size
        }
      };

    } catch (error) {
      console.error('❌ CSV validation error:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        `Validation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('preview')
  @RequirePermissions(Permission.CREATE_LEADS)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async previewCSV(
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      // Validate file
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      if (!file.originalname.endsWith('.csv')) {
        throw new BadRequestException('Only CSV files are allowed');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new BadRequestException('File size too large. Maximum 5MB allowed');
      }

      console.log(`📁 Previewing CSV file: ${file.originalname} (${file.size} bytes)`);

      if (!file.buffer) {
        throw new BadRequestException('File buffer is empty');
      }

      // Get preview
      const preview = await this.leadsImportService.getImportPreview(file.buffer);

      return {
        success: true,
        message: 'CSV preview generated successfully',
        data: preview
      };

    } catch (error) {
      console.error('❌ CSV preview error:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        `Preview failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('sales-agents')
  @RequirePermissions(Permission.VIEW_LEADS)
  async getSalesAgents() {
    try {
      const salesAgents = await this.leadsImportService.getSalesAgents();
      
      return {
        success: true,
        message: 'Sales agents retrieved successfully',
        data: salesAgents
      };
    } catch (error) {
      console.error('❌ Get sales agents error:', error);
      throw new HttpException(
        `Failed to get sales agents: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

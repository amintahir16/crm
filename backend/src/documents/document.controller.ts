import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';
import { Document, DocumentType, DocumentStatus, DocumentCategory } from './document.entity';
import * as fs from 'fs';

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: {
      documentName: string;
      documentType: DocumentType;
      category: DocumentCategory;
      description?: string;
      notes?: string;
      documentDate?: string;
      expiryDate?: string;
      version?: string;
      isPublic?: boolean;
      isEncrypted?: boolean;
      tags?: string;
      metadata?: string;
      customerId?: string;
      bookingId?: string;
      plotId?: string;
      constructionProjectId?: string;
    },
    @GetUser() user: User,
  ): Promise<Document> {
    return this.documentService.uploadDocument(
      file,
      {
        documentName: uploadDto.documentName,
        documentType: uploadDto.documentType,
        category: uploadDto.category,
        description: uploadDto.description,
        notes: uploadDto.notes,
        documentDate: uploadDto.documentDate ? new Date(uploadDto.documentDate) : undefined,
        expiryDate: uploadDto.expiryDate ? new Date(uploadDto.expiryDate) : undefined,
        version: uploadDto.version,
        isPublic: Boolean(uploadDto.isPublic),
        isEncrypted: Boolean(uploadDto.isEncrypted),
        tags: uploadDto.tags ? JSON.parse(uploadDto.tags) : undefined,
        metadata: uploadDto.metadata ? JSON.parse(uploadDto.metadata) : undefined,
        customerId: uploadDto.customerId,
        bookingId: uploadDto.bookingId,
        plotId: uploadDto.plotId,
        constructionProjectId: uploadDto.constructionProjectId,
      },
      user.id,
    );
  }

  @Put(':id')
  async updateDocument(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Body() updateDto: Partial<Document>,
  ): Promise<Document> {
    return this.documentService.updateDocument(documentId, updateDto);
  }

  @Put(':id/review')
  async reviewDocument(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Body() reviewDto: {
      approved: boolean;
      rejectionReason?: string;
    },
    @GetUser() user: User,
  ): Promise<Document> {
    return this.documentService.reviewDocument(
      documentId,
      reviewDto.approved,
      user.id,
      reviewDto.rejectionReason,
    );
  }

  @Get(':id')
  async getDocumentById(
    @Param('id', ParseUUIDPipe) documentId: string,
  ): Promise<Document> {
    return this.documentService.getDocumentById(documentId);
  }

  @Get(':id/download')
  async downloadDocument(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { filePath, fileName, mimeType } = await this.documentService.getDocumentFile(documentId);
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Get('customer/:customerId')
  async getDocumentsByCustomer(
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ): Promise<Document[]> {
    return this.documentService.getDocumentsByCustomer(customerId);
  }

  @Get('booking/:bookingId')
  async getDocumentsByBooking(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ): Promise<Document[]> {
    return this.documentService.getDocumentsByBooking(bookingId);
  }

  @Get('plot/:plotId')
  async getDocumentsByPlot(
    @Param('plotId', ParseUUIDPipe) plotId: string,
  ): Promise<Document[]> {
    return this.documentService.getDocumentsByPlot(plotId);
  }

  @Get('construction/:projectId')
  async getDocumentsByConstructionProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<Document[]> {
    return this.documentService.getDocumentsByConstructionProject(projectId);
  }

  @Get()
  async getAllDocuments(
    @Query('category') category?: DocumentCategory,
    @Query('documentType') documentType?: DocumentType,
    @Query('status') status?: DocumentStatus,
    @Query('isPublic') isPublic?: string,
    @Query('uploadedBy') uploadedBy?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<Document[]> {
    const filters: any = {};
    
    if (category) filters.category = category;
    if (documentType) filters.documentType = documentType;
    if (status) filters.status = status;
    if (isPublic !== undefined) filters.isPublic = isPublic === 'true';
    if (uploadedBy) filters.uploadedBy = uploadedBy;
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);

    return this.documentService.getAllDocuments(filters);
  }

  @Get('search/:term')
  async searchDocuments(
    @Param('term') searchTerm: string,
    @Query('category') category?: DocumentCategory,
    @Query('documentType') documentType?: DocumentType,
    @Query('status') status?: DocumentStatus,
  ): Promise<Document[]> {
    const filters: any = {};
    
    if (category) filters.category = category;
    if (documentType) filters.documentType = documentType;
    if (status) filters.status = status;

    return this.documentService.searchDocuments(searchTerm, filters);
  }

  @Delete(':id')
  async deleteDocument(
    @Param('id', ParseUUIDPipe) documentId: string,
  ): Promise<{ message: string }> {
    await this.documentService.deleteDocument(documentId);
    return { message: 'Document deleted successfully' };
  }

  @Get(':id/verify')
  async verifyDocumentIntegrity(
    @Param('id', ParseUUIDPipe) documentId: string,
  ): Promise<{ isValid: boolean }> {
    const isValid = await this.documentService.verifyDocumentIntegrity(documentId);
    return { isValid };
  }

  @Get('analytics/overview')
  async getDocumentAnalytics(): Promise<{
    totalDocuments: number;
    byCategory: Record<DocumentCategory, number>;
    byType: Record<DocumentType, number>;
    byStatus: Record<DocumentStatus, number>;
    totalSize: number;
    averageSize: number;
    recentUploads: number;
    expiringSoon: number;
  }> {
    return this.documentService.getDocumentAnalytics();
  }

  @Post('archive/expired')
  async archiveExpiredDocuments(): Promise<{ archivedCount: number }> {
    const archivedCount = await this.documentService.archiveExpiredDocuments();
    return { archivedCount };
  }
}

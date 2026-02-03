import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentType, DocumentStatus, DocumentCategory } from './document.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
  ) {}

  async uploadDocument(
    file: Express.Multer.File,
    documentData: {
      documentName: string;
      documentType: DocumentType;
      category: DocumentCategory;
      description?: string;
      notes?: string;
      documentDate?: Date;
      expiryDate?: Date;
      version?: string;
      isPublic?: boolean;
      isEncrypted?: boolean;
      tags?: string[];
      metadata?: any;
      customerId?: string;
      bookingId?: string;
      plotId?: string;
      constructionProjectId?: string;
    },
    uploadedBy: string,
  ): Promise<Document> {
    // Generate file hash for integrity checking
    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // Create document record
    const document = this.documentRepository.create({
      documentName: documentData.documentName,
      documentType: documentData.documentType,
      category: documentData.category,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileHash,
      description: documentData.description,
      notes: documentData.notes,
      documentDate: documentData.documentDate,
      expiryDate: documentData.expiryDate,
      version: documentData.version,
      isPublic: documentData.isPublic || false,
      isEncrypted: documentData.isEncrypted || false,
      tags: documentData.tags ? JSON.stringify(documentData.tags) : null,
      metadata: documentData.metadata ? JSON.stringify(documentData.metadata) : null,
      customerId: documentData.customerId,
      bookingId: documentData.bookingId,
      plotId: documentData.plotId,
      constructionProjectId: documentData.constructionProjectId,
      uploadedBy,
      status: DocumentStatus.DRAFT,
    });

    return await this.documentRepository.save(document);
  }

  async updateDocument(
    documentId: string,
    updateData: Partial<Document>,
  ): Promise<Document> {
    await this.documentRepository.update(documentId, updateData);
    return await this.documentRepository.findOne({
      where: { id: documentId },
      relations: [
        'uploadedByUser',
        'reviewedByUser',
        'customer',
        'booking',
        'plot',
        'constructionProject',
      ],
    });
  }

  async reviewDocument(
    documentId: string,
    approved: boolean,
    reviewedBy: string,
    rejectionReason?: string,
  ): Promise<Document> {
    const updateData: Partial<Document> = {
      reviewedBy,
      reviewedAt: new Date(),
    };

    if (approved) {
      updateData.status = DocumentStatus.APPROVED;
    } else {
      updateData.status = DocumentStatus.REJECTED;
      updateData.rejectionReason = rejectionReason;
    }

    await this.documentRepository.update(documentId, updateData);
    return await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['uploadedByUser', 'reviewedByUser'],
    });
  }

  async getDocumentById(documentId: string): Promise<Document> {
    return await this.documentRepository.findOne({
      where: { id: documentId },
      relations: [
        'uploadedByUser',
        'reviewedByUser',
        'customer',
        'booking',
        'plot',
        'constructionProject',
      ],
    });
  }

  async getDocumentsByCustomer(customerId: string): Promise<Document[]> {
    return await this.documentRepository.find({
      where: { customerId },
      relations: ['uploadedByUser', 'reviewedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async getDocumentsByBooking(bookingId: string): Promise<Document[]> {
    return await this.documentRepository.find({
      where: { bookingId },
      relations: ['uploadedByUser', 'reviewedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async getDocumentsByPlot(plotId: string): Promise<Document[]> {
    return await this.documentRepository.find({
      where: { plotId },
      relations: ['uploadedByUser', 'reviewedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async getDocumentsByConstructionProject(projectId: string): Promise<Document[]> {
    return await this.documentRepository.find({
      where: { constructionProjectId: projectId },
      relations: ['uploadedByUser', 'reviewedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllDocuments(
    filters?: {
      category?: DocumentCategory;
      documentType?: DocumentType;
      status?: DocumentStatus;
      isPublic?: boolean;
      uploadedBy?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
  ): Promise<Document[]> {
    const query = this.documentRepository.createQueryBuilder('document')
      .leftJoinAndSelect('document.uploadedByUser', 'uploadedBy')
      .leftJoinAndSelect('document.reviewedByUser', 'reviewedBy')
      .leftJoinAndSelect('document.customer', 'customer')
      .leftJoinAndSelect('document.booking', 'booking')
      .leftJoinAndSelect('document.plot', 'plot')
      .leftJoinAndSelect('document.constructionProject', 'project');

    if (filters) {
      if (filters.category) {
        query.andWhere('document.category = :category', { category: filters.category });
      }
      if (filters.documentType) {
        query.andWhere('document.documentType = :documentType', { documentType: filters.documentType });
      }
      if (filters.status) {
        query.andWhere('document.status = :status', { status: filters.status });
      }
      if (filters.isPublic !== undefined) {
        query.andWhere('document.isPublic = :isPublic', { isPublic: filters.isPublic });
      }
      if (filters.uploadedBy) {
        query.andWhere('document.uploadedBy = :uploadedBy', { uploadedBy: filters.uploadedBy });
      }
      if (filters.dateFrom) {
        query.andWhere('document.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
      }
      if (filters.dateTo) {
        query.andWhere('document.createdAt <= :dateTo', { dateTo: filters.dateTo });
      }
    }

    return await query.orderBy('document.createdAt', 'DESC').getMany();
  }

  async searchDocuments(
    searchTerm: string,
    filters?: {
      category?: DocumentCategory;
      documentType?: DocumentType;
      status?: DocumentStatus;
    },
  ): Promise<Document[]> {
    const query = this.documentRepository.createQueryBuilder('document')
      .leftJoinAndSelect('document.uploadedByUser', 'uploadedBy')
      .leftJoinAndSelect('document.reviewedByUser', 'reviewedBy')
      .where(
        '(document.documentName ILIKE :searchTerm OR document.description ILIKE :searchTerm OR document.fileName ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` }
      );

    if (filters) {
      if (filters.category) {
        query.andWhere('document.category = :category', { category: filters.category });
      }
      if (filters.documentType) {
        query.andWhere('document.documentType = :documentType', { documentType: filters.documentType });
      }
      if (filters.status) {
        query.andWhere('document.status = :status', { status: filters.status });
      }
    }

    return await query.orderBy('document.createdAt', 'DESC').getMany();
  }

  async deleteDocument(documentId: string): Promise<void> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Delete physical file
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete database record
    await this.documentRepository.delete(documentId);
  }

  async getDocumentFile(documentId: string): Promise<{ filePath: string; fileName: string; mimeType: string }> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    if (!fs.existsSync(document.filePath)) {
      throw new Error('Document file not found');
    }

    return {
      filePath: document.filePath,
      fileName: document.fileName,
      mimeType: document.mimeType,
    };
  }

  async verifyDocumentIntegrity(documentId: string): Promise<boolean> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document || !fs.existsSync(document.filePath)) {
      return false;
    }

    const fileBuffer = fs.readFileSync(document.filePath);
    const currentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    return currentHash === document.fileHash;
  }

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
    const documents = await this.documentRepository.find();

    const totalDocuments = documents.length;
    const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);
    const averageSize = totalDocuments > 0 ? totalSize / totalDocuments : 0;

    // Group by category
    const byCategory = {} as Record<DocumentCategory, number>;
    Object.values(DocumentCategory).forEach(category => {
      byCategory[category] = documents.filter(d => d.category === category).length;
    });

    // Group by type
    const byType = {} as Record<DocumentType, number>;
    Object.values(DocumentType).forEach(type => {
      byType[type] = documents.filter(d => d.documentType === type).length;
    });

    // Group by status
    const byStatus = {} as Record<DocumentStatus, number>;
    Object.values(DocumentStatus).forEach(status => {
      byStatus[status] = documents.filter(d => d.status === status).length;
    });

    // Recent uploads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUploads = documents.filter(d => d.createdAt >= sevenDaysAgo).length;

    // Expiring soon (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringSoon = documents.filter(
      d => d.expiryDate && d.expiryDate <= thirtyDaysFromNow && d.expiryDate >= new Date()
    ).length;

    return {
      totalDocuments,
      byCategory,
      byType,
      byStatus,
      totalSize,
      averageSize,
      recentUploads,
      expiringSoon,
    };
  }

  async archiveExpiredDocuments(): Promise<number> {
    const expiredDocuments = await this.documentRepository.find({
      where: {
        expiryDate: new Date(),
        status: DocumentStatus.APPROVED,
      },
    });

    let archivedCount = 0;
    for (const document of expiredDocuments) {
      if (document.expiryDate && document.expiryDate < new Date()) {
        await this.documentRepository.update(document.id, {
          status: DocumentStatus.EXPIRED,
        });
        archivedCount++;
      }
    }

    return archivedCount;
  }
}

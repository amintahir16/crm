import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  UseGuards, 
  UseInterceptors,
  UploadedFile,
  Request
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BookingPaymentService, AddPaymentDto, PaymentProofUploadDto } from './booking-payment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.guard';

@Controller('bookings/:bookingId/payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BookingPaymentController {
  constructor(private readonly bookingPaymentService: BookingPaymentService) {}

  @Post()
  @RequirePermissions(Permission.MANAGE_PAYMENTS)
  async addPayment(
    @Param('bookingId') bookingId: string,
    @Body() addPaymentDto: Omit<AddPaymentDto, 'bookingId' | 'processedBy'>,
    @Request() req: any,
  ) {
    const fullPaymentDto: AddPaymentDto = {
      ...addPaymentDto,
      bookingId,
      processedBy: req.user.id,
    };

    return await this.bookingPaymentService.addManualPayment(fullPaymentDto);
  }

  @Get()
  async getPayments(@Param('bookingId') bookingId: string) {
    return await this.bookingPaymentService.getBookingPayments(bookingId);
  }

  @Get('summary')
  async getPaymentSummary(@Param('bookingId') bookingId: string) {
    return await this.bookingPaymentService.getBookingPaymentSummary(bookingId);
  }

  @Post(':paymentId/proof')
  @RequirePermissions(Permission.MANAGE_PAYMENTS)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/payment-proofs',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        callback(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
      },
    }),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, callback) => {
      // Allow images and PDFs
      const allowedTypes = /jpeg|jpg|png|gif|pdf/;
      const extName = allowedTypes.test(extname(file.originalname).toLowerCase());
      const mimeType = allowedTypes.test(file.mimetype);
      
      if (mimeType && extName) {
        return callback(null, true);
      } else {
        callback(new Error('Only images and PDFs are allowed'), false);
      }
    },
  }))
  async uploadPaymentProof(
    @Param('paymentId') paymentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { proofType?: string; description?: string },
    @Request() req: any,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const paymentProofDto: PaymentProofUploadDto = {
      paymentId,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      proofType: body.proofType as any || 'screenshot',
      description: body.description,
      uploadedBy: req.user.id,
    };

    return await this.bookingPaymentService.uploadPaymentProof(paymentProofDto);
  }

  @Delete('proof/:proofId')
  @RequirePermissions(Permission.MANAGE_PAYMENTS)
  async deletePaymentProof(@Param('proofId') proofId: string) {
    await this.bookingPaymentService.deletePaymentProof(proofId);
    return { message: 'Payment proof deleted successfully' };
  }
}

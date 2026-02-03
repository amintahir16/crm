import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  UseGuards,
  ParseUUIDPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConstructionService } from './construction.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';
import { 
  ConstructionProject, 
  ConstructionStatus, 
  ConstructionType 
} from './construction-project.entity';
import { 
  ConstructionPhase, 
  PhaseStatus, 
  PhaseType 
} from './construction-phase.entity';
import { 
  ConstructionTask, 
  TaskStatus, 
  TaskPriority 
} from './construction-task.entity';
import { 
  ConstructionExpense, 
  ExpenseCategory, 
  ExpenseStatus 
} from './construction-expense.entity';
import { 
  ConstructionDocument, 
  DocumentType, 
  DocumentStatus 
} from './construction-document.entity';

@UseGuards(JwtAuthGuard)
@Controller('construction')
export class ConstructionController {
  constructor(private readonly constructionService: ConstructionService) {}

  // Project Management
  @Post('projects')
  async createProject(
    @Body() createProjectDto: {
      bookingId: string;
      projectName: string;
      constructionType: ConstructionType;
      estimatedCost: number;
      description?: string;
      specifications?: string;
      materials?: string;
      notes?: string;
      architectName?: string;
      architectContact?: string;
      contractorName?: string;
      contractorContact?: string;
      supervisorName?: string;
      supervisorContact?: string;
      startDate?: string;
      expectedCompletionDate?: string;
    },
    @GetUser() user: User,
  ): Promise<ConstructionProject> {
    return this.constructionService.createProject(
      createProjectDto.bookingId,
      {
        projectName: createProjectDto.projectName,
        constructionType: createProjectDto.constructionType,
        estimatedCost: createProjectDto.estimatedCost,
        description: createProjectDto.description,
        specifications: createProjectDto.specifications,
        materials: createProjectDto.materials,
        notes: createProjectDto.notes,
        architectName: createProjectDto.architectName,
        architectContact: createProjectDto.architectContact,
        contractorName: createProjectDto.contractorName,
        contractorContact: createProjectDto.contractorContact,
        supervisorName: createProjectDto.supervisorName,
        supervisorContact: createProjectDto.supervisorContact,
        startDate: createProjectDto.startDate ? new Date(createProjectDto.startDate) : undefined,
        expectedCompletionDate: createProjectDto.expectedCompletionDate 
          ? new Date(createProjectDto.expectedCompletionDate) 
          : undefined,
      },
      user.id,
    );
  }

  @Put('projects/:id')
  async updateProject(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() updateProjectDto: Partial<ConstructionProject>,
  ): Promise<ConstructionProject> {
    return this.constructionService.updateProject(projectId, updateProjectDto);
  }

  @Get('projects/:id')
  async getProjectById(
    @Param('id', ParseUUIDPipe) projectId: string,
  ): Promise<ConstructionProject> {
    return this.constructionService.getProjectById(projectId);
  }

  @Get('projects/booking/:bookingId')
  async getProjectsByBooking(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ): Promise<ConstructionProject[]> {
    return this.constructionService.getProjectsByBooking(bookingId);
  }

  @Get('projects')
  async getAllProjects(): Promise<ConstructionProject[]> {
    return this.constructionService.getAllProjects();
  }

  // Phase Management
  @Post('phases')
  async createPhase(
    @Body() createPhaseDto: {
      projectId: string;
      phaseName: string;
      phaseType: PhaseType;
      estimatedCost: number;
      description?: string;
      specifications?: string;
      materials?: string;
      notes?: string;
      contractorName?: string;
      contractorContact?: string;
      supervisorName?: string;
      supervisorContact?: string;
      startDate?: string;
      expectedEndDate?: string;
      sequence?: number;
    },
  ): Promise<ConstructionPhase> {
    return this.constructionService.createPhase(createPhaseDto.projectId, {
      phaseName: createPhaseDto.phaseName,
      phaseType: createPhaseDto.phaseType,
      estimatedCost: createPhaseDto.estimatedCost,
      description: createPhaseDto.description,
      specifications: createPhaseDto.specifications,
      materials: createPhaseDto.materials,
      notes: createPhaseDto.notes,
      contractorName: createPhaseDto.contractorName,
      contractorContact: createPhaseDto.contractorContact,
      supervisorName: createPhaseDto.supervisorName,
      supervisorContact: createPhaseDto.supervisorContact,
      startDate: createPhaseDto.startDate ? new Date(createPhaseDto.startDate) : undefined,
      expectedEndDate: createPhaseDto.expectedEndDate ? new Date(createPhaseDto.expectedEndDate) : undefined,
      sequence: createPhaseDto.sequence,
    });
  }

  @Put('phases/:id')
  async updatePhase(
    @Param('id', ParseUUIDPipe) phaseId: string,
    @Body() updatePhaseDto: Partial<ConstructionPhase>,
  ): Promise<ConstructionPhase> {
    return this.constructionService.updatePhase(phaseId, updatePhaseDto);
  }

  @Get('phases/project/:projectId')
  async getPhasesByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<ConstructionPhase[]> {
    return this.constructionService.getPhasesByProject(projectId);
  }

  // Task Management
  @Post('tasks')
  async createTask(
    @Body() createTaskDto: {
      phaseId: string;
      taskName: string;
      estimatedCost: number;
      priority?: TaskPriority;
      description?: string;
      specifications?: string;
      materials?: string;
      notes?: string;
      contractorName?: string;
      contractorContact?: string;
      startDate?: string;
      dueDate?: string;
      sequence?: number;
    },
    @GetUser() user: User,
  ): Promise<ConstructionTask> {
    return this.constructionService.createTask(createTaskDto.phaseId, {
      taskName: createTaskDto.taskName,
      estimatedCost: createTaskDto.estimatedCost,
      priority: createTaskDto.priority,
      description: createTaskDto.description,
      specifications: createTaskDto.specifications,
      materials: createTaskDto.materials,
      notes: createTaskDto.notes,
      contractorName: createTaskDto.contractorName,
      contractorContact: createTaskDto.contractorContact,
      assignedTo: user.id,
      startDate: createTaskDto.startDate ? new Date(createTaskDto.startDate) : undefined,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
      sequence: createTaskDto.sequence,
    });
  }

  @Put('tasks/:id')
  async updateTask(
    @Param('id', ParseUUIDPipe) taskId: string,
    @Body() updateTaskDto: Partial<ConstructionTask>,
  ): Promise<ConstructionTask> {
    return this.constructionService.updateTask(taskId, updateTaskDto);
  }

  @Get('tasks/phase/:phaseId')
  async getTasksByPhase(
    @Param('phaseId', ParseUUIDPipe) phaseId: string,
  ): Promise<ConstructionTask[]> {
    return this.constructionService.getTasksByPhase(phaseId);
  }

  // Expense Management
  @Post('expenses')
  async createExpense(
    @Body() createExpenseDto: {
      projectId: string;
      expenseName: string;
      category: ExpenseCategory;
      amount: number;
      expenseDate: string;
      dueDate?: string;
      description?: string;
      notes?: string;
      vendorName?: string;
      vendorContact?: string;
      invoiceNumber?: string;
      paymentMethod?: string;
    },
    @GetUser() user: User,
  ): Promise<ConstructionExpense> {
    return this.constructionService.createExpense(
      createExpenseDto.projectId,
      {
        expenseName: createExpenseDto.expenseName,
        category: createExpenseDto.category,
        amount: createExpenseDto.amount,
        expenseDate: new Date(createExpenseDto.expenseDate),
        dueDate: createExpenseDto.dueDate ? new Date(createExpenseDto.dueDate) : undefined,
        description: createExpenseDto.description,
        notes: createExpenseDto.notes,
        vendorName: createExpenseDto.vendorName,
        vendorContact: createExpenseDto.vendorContact,
        invoiceNumber: createExpenseDto.invoiceNumber,
        paymentMethod: createExpenseDto.paymentMethod,
      },
      user.id,
    );
  }

  @Put('expenses/:id/approve')
  async approveExpense(
    @Param('id', ParseUUIDPipe) expenseId: string,
    @Body() approveExpenseDto: {
      approved: boolean;
      rejectionReason?: string;
    },
    @GetUser() user: User,
  ): Promise<ConstructionExpense> {
    return this.constructionService.approveExpense(
      expenseId,
      approveExpenseDto.approved,
      user.id,
      approveExpenseDto.rejectionReason,
    );
  }

  @Get('expenses/project/:projectId')
  async getExpensesByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<ConstructionExpense[]> {
    return this.constructionService.getExpensesByProject(projectId);
  }

  // Document Management
  @Post('documents')
  @UseInterceptors(FileInterceptor('file'))
  async createDocument(
    @Body() createDocumentDto: {
      projectId: string;
      documentName: string;
      documentType: DocumentType;
      description?: string;
      notes?: string;
      documentDate?: string;
      expiryDate?: string;
      version?: string;
    },
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ): Promise<ConstructionDocument> {
    return this.constructionService.createDocument(
      createDocumentDto.projectId,
      {
        documentName: createDocumentDto.documentName,
        documentType: createDocumentDto.documentType,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        description: createDocumentDto.description,
        notes: createDocumentDto.notes,
        documentDate: createDocumentDto.documentDate ? new Date(createDocumentDto.documentDate) : undefined,
        expiryDate: createDocumentDto.expiryDate ? new Date(createDocumentDto.expiryDate) : undefined,
        version: createDocumentDto.version,
      },
      user.id,
    );
  }

  @Put('documents/:id/approve')
  async approveDocument(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Body() approveDocumentDto: {
      approved: boolean;
      rejectionReason?: string;
    },
    @GetUser() user: User,
  ): Promise<ConstructionDocument> {
    return this.constructionService.approveDocument(
      documentId,
      approveDocumentDto.approved,
      user.id,
      approveDocumentDto.rejectionReason,
    );
  }

  @Get('documents/project/:projectId')
  async getDocumentsByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<ConstructionDocument[]> {
    return this.constructionService.getDocumentsByProject(projectId);
  }

  // Analytics
  @Get('analytics')
  async getConstructionAnalytics(): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalCost: number;
    totalExpenses: number;
    byStatus: Record<ConstructionStatus, number>;
    byType: Record<ConstructionType, number>;
    averageCompletionTime: number;
    costOverrunProjects: number;
  }> {
    return this.constructionService.getConstructionAnalytics();
  }
}

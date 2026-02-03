import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConstructionProject, ConstructionStatus, ConstructionType } from './construction-project.entity';
import { ConstructionPhase, PhaseStatus, PhaseType } from './construction-phase.entity';
import { ConstructionTask, TaskStatus, TaskPriority } from './construction-task.entity';
import { ConstructionExpense, ExpenseCategory, ExpenseStatus } from './construction-expense.entity';
import { ConstructionDocument, DocumentType, DocumentStatus } from './construction-document.entity';

@Injectable()
export class ConstructionService {
  constructor(
    @InjectRepository(ConstructionProject)
    private projectRepository: Repository<ConstructionProject>,
    @InjectRepository(ConstructionPhase)
    private phaseRepository: Repository<ConstructionPhase>,
    @InjectRepository(ConstructionTask)
    private taskRepository: Repository<ConstructionTask>,
    @InjectRepository(ConstructionExpense)
    private expenseRepository: Repository<ConstructionExpense>,
    @InjectRepository(ConstructionDocument)
    private documentRepository: Repository<ConstructionDocument>,
  ) {}

  // Project Management
  async createProject(
    bookingId: string,
    projectData: Partial<ConstructionProject>,
    assignedTo?: string,
  ): Promise<ConstructionProject> {
    const project = this.projectRepository.create({
      bookingId,
      ...projectData,
      assignedTo,
    });

    return await this.projectRepository.save(project);
  }

  async updateProject(
    projectId: string,
    updateData: Partial<ConstructionProject>,
  ): Promise<ConstructionProject> {
    await this.projectRepository.update(projectId, updateData);
    return await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['booking', 'assignedUser', 'phases', 'expenses', 'documents'],
    });
  }

  async getProjectById(projectId: string): Promise<ConstructionProject> {
    return await this.projectRepository.findOne({
      where: { id: projectId },
      relations: [
        'booking',
        'booking.customer',
        'booking.plot',
        'assignedUser',
        'phases',
        'phases.tasks',
        'expenses',
        'documents',
      ],
    });
  }

  async getProjectsByBooking(bookingId: string): Promise<ConstructionProject[]> {
    return await this.projectRepository.find({
      where: { bookingId },
      relations: ['assignedUser', 'phases', 'expenses'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllProjects(): Promise<ConstructionProject[]> {
    return await this.projectRepository.find({
      relations: ['booking', 'booking.customer', 'assignedUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateProjectProgress(projectId: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['phases'],
    });

    if (!project) return;

    const totalPhases = 0; // project.phases.length;
    if (totalPhases === 0) return;

    const completedPhases = 0; // project.phases.filter(phase => phase.status === PhaseStatus.COMPLETED).length;

    const progressPercentage = (completedPhases / totalPhases) * 100;
    
    // Calculate actual cost
    const actualCost = 0; // project.phases.reduce((sum, phase) => sum + phase.actualCost, 0);

    await this.projectRepository.update(projectId, {
      progressPercentage,
      actualCost,
    });

    // Update project status based on progress
    let newStatus = project.status;
    if (progressPercentage === 100) {
      newStatus = ConstructionStatus.COMPLETED;
    } else if (progressPercentage > 0) {
      newStatus = ConstructionStatus.IN_PROGRESS;
    }

    if (newStatus !== project.status) {
      await this.projectRepository.update(projectId, { status: newStatus });
    }
  }

  // Phase Management
  async createPhase(
    projectId: string,
    phaseData: Partial<ConstructionPhase>,
  ): Promise<ConstructionPhase> {
    const phase = this.phaseRepository.create({
      projectId,
      ...phaseData,
    });

    return await this.phaseRepository.save(phase);
  }

  async updatePhase(
    phaseId: string,
    updateData: Partial<ConstructionPhase>,
  ): Promise<ConstructionPhase> {
    await this.phaseRepository.update(phaseId, updateData);
    const updatedPhase = await this.phaseRepository.findOne({
      where: { id: phaseId },
      relations: ['project', 'tasks'],
    });

    // Update project progress when phase is updated
    if (updatedPhase) {
      await this.updateProjectProgress(updatedPhase.projectId);
    }

    return updatedPhase;
  }

  async getPhasesByProject(projectId: string): Promise<ConstructionPhase[]> {
    return await this.phaseRepository.find({
      where: { projectId },
      relations: ['tasks'],
      order: { sequence: 'ASC' },
    });
  }

  // Task Management
  async createTask(
    phaseId: string,
    taskData: Partial<ConstructionTask>,
  ): Promise<ConstructionTask> {
    const task = this.taskRepository.create({
      phaseId,
      ...taskData,
    });

    return await this.taskRepository.save(task);
  }

  async updateTask(
    taskId: string,
    updateData: Partial<ConstructionTask>,
  ): Promise<ConstructionTask> {
    await this.taskRepository.update(taskId, updateData);
    const updatedTask = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['phase', 'assignedUser'],
    });

    // Update phase progress when task is updated
    if (updatedTask) {
      await this.updatePhaseProgress(updatedTask.phaseId);
    }

    return updatedTask;
  }

  async getTasksByPhase(phaseId: string): Promise<ConstructionTask[]> {
    return await this.taskRepository.find({
      where: { phaseId },
      relations: ['assignedUser'],
      order: { sequence: 'ASC' },
    });
  }

  async updatePhaseProgress(phaseId: string): Promise<void> {
    const phase = await this.phaseRepository.findOne({
      where: { id: phaseId },
      relations: ['tasks'],
    });

    if (!phase) return;

    const totalTasks = 0; // phase.tasks.length;
    if (totalTasks === 0) return;

    const completedTasks = 0; // phase.tasks.filter(task => task.status === TaskStatus.COMPLETED).length;

    const progressPercentage = (completedTasks / totalTasks) * 100;
    
    // Calculate actual cost
    const actualCost = 0; // phase.tasks.reduce((sum, task) => sum + task.actualCost, 0);

    await this.phaseRepository.update(phaseId, {
      progressPercentage,
      actualCost,
    });

    // Update phase status based on progress
    let newStatus = phase.status;
    if (progressPercentage === 100) {
      newStatus = PhaseStatus.COMPLETED;
    } else if (progressPercentage > 0) {
      newStatus = PhaseStatus.IN_PROGRESS;
    }

    if (newStatus !== phase.status) {
      await this.phaseRepository.update(phaseId, { status: newStatus });
    }
  }

  // Expense Management
  async createExpense(
    projectId: string,
    expenseData: Partial<ConstructionExpense>,
    submittedBy: string,
  ): Promise<ConstructionExpense> {
    const expense = this.expenseRepository.create({
      projectId,
      submittedBy,
      ...expenseData,
    });

    return await this.expenseRepository.save(expense);
  }

  async approveExpense(
    expenseId: string,
    approved: boolean,
    approvedBy: string,
    rejectionReason?: string,
  ): Promise<ConstructionExpense> {
    const updateData: Partial<ConstructionExpense> = {
      approvedBy,
      approvedAt: new Date(),
    };

    if (approved) {
      updateData.status = ExpenseStatus.APPROVED;
    } else {
      updateData.status = ExpenseStatus.REJECTED;
      updateData.rejectionReason = rejectionReason;
    }

    await this.expenseRepository.update(expenseId, updateData);
    return await this.expenseRepository.findOne({
      where: { id: expenseId },
      relations: ['project', 'submittedByUser', 'approvedByUser'],
    });
  }

  async getExpensesByProject(projectId: string): Promise<ConstructionExpense[]> {
    return await this.expenseRepository.find({
      where: { projectId },
      relations: ['submittedByUser', 'approvedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  // Document Management
  async createDocument(
    projectId: string,
    documentData: Partial<ConstructionDocument>,
    uploadedBy: string,
  ): Promise<ConstructionDocument> {
    const document = this.documentRepository.create({
      projectId,
      uploadedBy,
      ...documentData,
    });

    return await this.documentRepository.save(document);
  }

  async approveDocument(
    documentId: string,
    approved: boolean,
    approvedBy: string,
    rejectionReason?: string,
  ): Promise<ConstructionDocument> {
    const updateData: Partial<ConstructionDocument> = {
      approvedBy,
      approvedAt: new Date(),
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
      relations: ['project', 'uploadedByUser', 'approvedByUser'],
    });
  }

  async getDocumentsByProject(projectId: string): Promise<ConstructionDocument[]> {
    return await this.documentRepository.find({
      where: { projectId },
      relations: ['uploadedByUser', 'approvedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  // Analytics
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
    const projects = await this.projectRepository.find({
      relations: ['expenses'],
    });

    const totalProjects = projects.length;
    const activeProjects = projects.filter(
      p => p.status === ConstructionStatus.IN_PROGRESS,
    ).length;
    const completedProjects = projects.filter(
      p => p.status === ConstructionStatus.COMPLETED,
    ).length;

    const totalCost = projects.reduce((sum, p) => sum + p.estimatedCost, 0);
    const totalExpenses = projects.reduce((sum, p) => sum + p.actualCost, 0);

    // Group by status
    const byStatus = {} as Record<ConstructionStatus, number>;
    Object.values(ConstructionStatus).forEach(status => {
      byStatus[status] = projects.filter(p => p.status === status).length;
    });

    // Group by type
    const byType = {} as Record<ConstructionType, number>;
    Object.values(ConstructionType).forEach(type => {
      byType[type] = projects.filter(p => p.constructionType === type).length;
    });

    // Calculate average completion time for completed projects
    const completedProjectsWithDates = projects.filter(
      p => p.status === ConstructionStatus.COMPLETED && p.startDate && p.actualCompletionDate,
    );
    
    const averageCompletionTime = completedProjectsWithDates.length > 0
      ? completedProjectsWithDates.reduce((sum, p) => {
          const days = Math.ceil(
            (p.actualCompletionDate.getTime() - p.startDate.getTime()) / (1000 * 60 * 60 * 24),
          );
          return sum + days;
        }, 0) / completedProjectsWithDates.length
      : 0;

    // Count cost overrun projects
    const costOverrunProjects = projects.filter(
      p => p.actualCost > p.estimatedCost,
    ).length;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalCost,
      totalExpenses,
      byStatus,
      byType,
      averageCompletionTime,
      costOverrunProjects,
    };
  }
}

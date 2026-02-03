import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../users/user.entity';

export enum Permission {
  // Plot Management
  VIEW_PLOTS = 'view_plots',
  CREATE_PLOTS = 'create_plots',
  EDIT_PLOTS = 'edit_plots',
  DELETE_PLOTS = 'delete_plots',
  
  // Customer Management (CRM Core)
  VIEW_CUSTOMERS = 'view_customers',
  CREATE_CUSTOMERS = 'create_customers',
  EDIT_CUSTOMERS = 'edit_customers',
  DELETE_CUSTOMERS = 'delete_customers',
  VIEW_CUSTOMER_DETAILS = 'view_customer_details',
  MANAGE_CUSTOMER_INTERACTIONS = 'manage_customer_interactions',
  
  // Lead Management (CRM Core)
  VIEW_LEADS = 'view_leads',
  CREATE_LEADS = 'create_leads',
  EDIT_LEADS = 'edit_leads',
  DELETE_LEADS = 'delete_leads',
  CONVERT_LEADS = 'convert_leads',
  ASSIGN_LEADS = 'assign_leads',
  VIEW_LEAD_ANALYTICS = 'view_lead_analytics',
  
  // Booking Management (CRM Core)
  VIEW_BOOKINGS = 'view_bookings',
  CREATE_BOOKINGS = 'create_bookings',
  EDIT_BOOKINGS = 'edit_bookings',
  DELETE_BOOKINGS = 'delete_bookings',
  
  // Payment Management
  VIEW_PAYMENTS = 'view_payments',
  CREATE_PAYMENTS = 'create_payments',
  APPROVE_PAYMENTS = 'approve_payments',
  REFUND_PAYMENTS = 'refund_payments',
  MANAGE_PAYMENTS = 'manage_payments',
  MANAGE_PAYMENT_PLANS = 'manage_payment_plans',
  
  // Construction Management
  VIEW_CONSTRUCTION = 'view_construction',
  CREATE_CONSTRUCTION = 'create_construction',
  EDIT_CONSTRUCTION = 'edit_construction',
  DELETE_CONSTRUCTION = 'delete_construction',
  
  // Document Management
  VIEW_DOCUMENTS = 'view_documents',
  UPLOAD_DOCUMENTS = 'upload_documents',
  APPROVE_DOCUMENTS = 'approve_documents',
  DELETE_DOCUMENTS = 'delete_documents',
  
  // Communication (CRM Core)
  VIEW_MESSAGES = 'view_messages',
  SEND_MESSAGES = 'send_messages',
  VIEW_NOTIFICATIONS = 'view_notifications',
  SEND_BULK_MESSAGES = 'send_bulk_messages',
  
  // Analytics
  VIEW_ANALYTICS = 'view_analytics',
  VIEW_SALES_ANALYTICS = 'view_sales_analytics',
  VIEW_CRM_ANALYTICS = 'view_crm_analytics',
  EXPORT_REPORTS = 'export_reports',
  
  // User Management
  VIEW_USERS = 'view_users',
  CREATE_USERS = 'create_users',
  EDIT_USERS = 'edit_users',
  DELETE_USERS = 'delete_users',
  MANAGE_SALES_TEAM = 'manage_sales_team',
  
  // System Administration
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  SYSTEM_CONFIGURATION = 'system_configuration',
  BACKUP_RESTORE = 'backup_restore',
  
  // Finance Management
  VIEW_FINANCE = 'view_finance',
  MANAGE_FINANCE = 'manage_finance',
  VIEW_FINANCIAL_REPORTS = 'view_financial_reports',
  
  // Team Management
  MANAGE_TEAM_MEMBERS = 'manage_team_members',
  VIEW_TEAM_ACTIVITIES = 'view_team_activities',
}

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // Admin has full access to everything
  [UserRole.ADMIN]: Object.values(Permission),
  
  // Sales Manager - Full CRM access + team management
  [UserRole.SALES_MANAGER]: [
    // Plot viewing (for sales purposes)
    Permission.VIEW_PLOTS,
    
    // Full CRM permissions
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMERS,
    Permission.EDIT_CUSTOMERS,
    Permission.DELETE_CUSTOMERS,
    Permission.VIEW_CUSTOMER_DETAILS,
    Permission.MANAGE_CUSTOMER_INTERACTIONS,
    
    // Lead management (full access)
    Permission.VIEW_LEADS,
    Permission.CREATE_LEADS,
    Permission.EDIT_LEADS,
    Permission.DELETE_LEADS,
    Permission.CONVERT_LEADS,
    Permission.ASSIGN_LEADS,
    Permission.VIEW_LEAD_ANALYTICS,
    
    // Booking management (full access)
    Permission.VIEW_BOOKINGS,
    Permission.CREATE_BOOKINGS,
    Permission.EDIT_BOOKINGS,
    Permission.DELETE_BOOKINGS,
    
    // Payment viewing (for sales tracking)
    Permission.VIEW_PAYMENTS,
    
    // Communication permissions
    Permission.VIEW_MESSAGES,
    Permission.SEND_MESSAGES,
    Permission.VIEW_NOTIFICATIONS,
    Permission.SEND_BULK_MESSAGES,
    
    // Document management
    Permission.VIEW_DOCUMENTS,
    Permission.UPLOAD_DOCUMENTS,
    Permission.APPROVE_DOCUMENTS,
    Permission.DELETE_DOCUMENTS,
    
    // Analytics and reporting
    Permission.VIEW_SALES_ANALYTICS,
    Permission.VIEW_CRM_ANALYTICS,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_REPORTS,
    
    // Team management permissions (new)
    Permission.MANAGE_TEAM_MEMBERS,
    Permission.VIEW_TEAM_ACTIVITIES,
    Permission.ASSIGN_LEADS,
    
    // User management (for viewing team members)
    Permission.VIEW_USERS,
    Permission.MANAGE_SALES_TEAM,
  ],
  
  // Sales Person - CRM focused permissions only (limited to assigned data)
  [UserRole.SALES_PERSON]: [
    // Plot viewing only (for sales purposes)
    Permission.VIEW_PLOTS,
    
    // Full CRM permissions
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMERS,
    Permission.EDIT_CUSTOMERS,
    Permission.VIEW_CUSTOMER_DETAILS,
    Permission.MANAGE_CUSTOMER_INTERACTIONS,
    
    // Lead management (core CRM)
    Permission.VIEW_LEADS,
    Permission.CREATE_LEADS,
    Permission.EDIT_LEADS,
    Permission.CONVERT_LEADS,
    Permission.ASSIGN_LEADS,
    Permission.VIEW_LEAD_ANALYTICS,
    
    // Booking management (sales process)
    Permission.VIEW_BOOKINGS,
    Permission.CREATE_BOOKINGS,
    Permission.EDIT_BOOKINGS,
    
    // Payment viewing only (for sales tracking)
    Permission.VIEW_PAYMENTS,
    
    // Notifications only (no messaging)
    Permission.VIEW_NOTIFICATIONS,
    
    // Document management (customer documents)
    Permission.VIEW_DOCUMENTS,
    Permission.UPLOAD_DOCUMENTS,
    
    // Sales analytics only
    Permission.VIEW_SALES_ANALYTICS,
    Permission.VIEW_CRM_ANALYTICS,
  ],
  
  // Accountant - Finance focused
  [UserRole.ACCOUNTANT]: [
    Permission.VIEW_PLOTS,
    Permission.VIEW_CUSTOMERS,
    Permission.VIEW_LEADS,
    Permission.VIEW_BOOKINGS,
    Permission.VIEW_PAYMENTS,
    Permission.CREATE_PAYMENTS,
    Permission.APPROVE_PAYMENTS,
    Permission.REFUND_PAYMENTS,
    Permission.MANAGE_PAYMENTS,
    Permission.MANAGE_PAYMENT_PLANS,
    Permission.VIEW_DOCUMENTS,
    Permission.UPLOAD_DOCUMENTS,
    Permission.VIEW_NOTIFICATIONS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_FINANCE,
    Permission.MANAGE_FINANCE,
    Permission.VIEW_FINANCIAL_REPORTS,
    Permission.EXPORT_REPORTS,
  ],
  
  // Investor - Read-only access to relevant data
  [UserRole.INVESTOR]: [
    Permission.VIEW_PLOTS,
    Permission.VIEW_CUSTOMERS,
    Permission.VIEW_BOOKINGS,
    Permission.VIEW_PAYMENTS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_NOTIFICATIONS,
  ],
  
  // Buyer - Limited access to own data
  [UserRole.BUYER]: [
    Permission.VIEW_PLOTS,
    Permission.VIEW_CUSTOMERS,
    Permission.VIEW_BOOKINGS,
    Permission.VIEW_PAYMENTS,
    Permission.VIEW_DOCUMENTS,
    Permission.VIEW_NOTIFICATIONS,
  ],
  
  // Auditor - Read-only access for compliance
  [UserRole.AUDITOR]: [
    Permission.VIEW_PLOTS,
    Permission.VIEW_CUSTOMERS,
    Permission.VIEW_BOOKINGS,
    Permission.VIEW_PAYMENTS,
    Permission.VIEW_DOCUMENTS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_FINANCE,
    Permission.VIEW_FINANCIAL_REPORTS,
    Permission.EXPORT_REPORTS,
  ],
};

// Decorator for setting required permissions
export const RequirePermissions = (...permissions: Permission[]) => SetMetadata('permissions', permissions);

// Helper function to check if user has permission
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  return userPermissions.includes(permission);
}

// Helper function to get all permissions for a role
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    
    return requiredPermissions.every((permission) => 
      userPermissions.includes(permission)
    );
  }
}

export interface LeadAutomationConfig {
  // Facebook Lead Ads Configuration
  facebook: {
    enabled: boolean;
    appId: string;
    appSecret: string;
    verifyToken: string;
    accessToken: string;
    pageId: string;
  };

  // Google Ads Configuration
  googleAds: {
    enabled: boolean;
    customerId: string;
    developerToken: string;
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  };

  // WhatsApp Business API Configuration
  whatsapp: {
    enabled: boolean;
    accessToken: string;
    phoneNumberId: string;
    verifyToken: string;
    webhookSecret: string;
  };

  // Lead Assignment Rules
  assignment: {
    enabled: boolean;
    defaultAssigneeId?: string;
    roundRobin: boolean;
    rules: Array<{
      id: string;
      name: string;
      conditions: {
        source?: string[];
        budgetMin?: number;
        budgetMax?: number;
        keywords?: string[];
        campaignPattern?: string;
      };
      assignToUserId: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      enabled: boolean;
    }>;
  };

  // Notification Settings
  notifications: {
    enabled: boolean;
    emailNotifications: boolean;
    slackWebhook?: string;
    telegramBotToken?: string;
    telegramChatId?: string;
  };

  // Lead Scoring
  scoring: {
    enabled: boolean;
    rules: Array<{
      condition: string;
      points: number;
    }>;
  };
}

export const defaultLeadAutomationConfig: LeadAutomationConfig = {
  facebook: {
    enabled: false,
    appId: process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
    verifyToken: process.env.FACEBOOK_VERIFY_TOKEN || 'your-verify-token',
    accessToken: process.env.FACEBOOK_ACCESS_TOKEN || '',
    pageId: process.env.FACEBOOK_PAGE_ID || '',
  },

  googleAds: {
    enabled: false,
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID || '',
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
  },

  whatsapp: {
    enabled: false,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'your-whatsapp-verify-token',
    webhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET || '',
  },

  assignment: {
    enabled: true,
    roundRobin: true,
    rules: [
      {
        id: 'high-budget-leads',
        name: 'High Budget Leads (5+ Crore)',
        conditions: {
          budgetMin: 50000000, // 5 crore
        },
        assignToUserId: 'senior-sales-agent-1',
        priority: 'urgent',
        enabled: true,
      },
      {
        id: 'whatsapp-leads',
        name: 'WhatsApp Inquiries',
        conditions: {
          source: ['whatsapp'],
        },
        assignToUserId: 'whatsapp-specialist',
        priority: 'high',
        enabled: true,
      },
      {
        id: 'facebook-premium-campaigns',
        name: 'Facebook Premium Campaigns',
        conditions: {
          source: ['facebook_ads'],
          campaignPattern: 'premium',
        },
        assignToUserId: 'facebook-specialist',
        priority: 'medium',
        enabled: true,
      },
    ],
  },

  notifications: {
    enabled: true,
    emailNotifications: true,
    slackWebhook: process.env.SLACK_WEBHOOK_URL,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
  },

  scoring: {
    enabled: true,
    rules: [
      { condition: 'source:whatsapp', points: 20 },
      { condition: 'budget:>5000000', points: 30 },
      { condition: 'budget:>10000000', points: 50 },
      { condition: 'source:referral', points: 40 },
      { condition: 'keywords:urgent,immediate', points: 25 },
    ],
  },
};

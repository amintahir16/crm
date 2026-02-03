import { Controller, Post, Body, Headers, Logger, BadRequestException } from '@nestjs/common';
import { LeadAutomationService, AutoLeadData } from '../lead-automation.service';
import { LeadSource } from '../lead.entity';

@Controller('webhooks/leads')
export class LeadWebhooksController {
  private readonly logger = new Logger(LeadWebhooksController.name);

  constructor(private leadAutomationService: LeadAutomationService) {}

  /**
   * Facebook Lead Ads Webhook
   * Receives leads from Facebook Lead Generation campaigns
   */
  @Post('facebook')
  async handleFacebookLead(@Body() payload: any, @Headers() headers: any) {
    try {
      this.logger.log('Received Facebook lead webhook', payload);

      // Verify Facebook webhook (implement signature verification)
      if (!this.verifyFacebookWebhook(payload, headers)) {
        throw new BadRequestException('Invalid Facebook webhook signature');
      }

      // Process Facebook lead data
      const leadData = this.parseFacebookLead(payload);
      const lead = await this.leadAutomationService.processIncomingLead(leadData);

      return { success: true, leadId: lead.id };
    } catch (error) {
      this.logger.error('Error processing Facebook lead', error);
      throw error;
    }
  }

  /**
   * Google Ads Lead Form Webhook
   */
  @Post('google-ads')
  async handleGoogleAdsLead(@Body() payload: any, @Headers() headers: any) {
    try {
      this.logger.log('Received Google Ads lead webhook', payload);

      const leadData = this.parseGoogleAdsLead(payload);
      const lead = await this.leadAutomationService.processIncomingLead(leadData);

      return { success: true, leadId: lead.id };
    } catch (error) {
      this.logger.error('Error processing Google Ads lead', error);
      throw error;
    }
  }

  /**
   * WhatsApp Business API Webhook
   */
  @Post('whatsapp')
  async handleWhatsAppLead(@Body() payload: any, @Headers() headers: any) {
    try {
      this.logger.log('Received WhatsApp webhook', payload);

      // Verify WhatsApp webhook
      if (!this.verifyWhatsAppWebhook(payload, headers)) {
        throw new BadRequestException('Invalid WhatsApp webhook signature');
      }

      const leadData = this.parseWhatsAppMessage(payload);
      if (leadData) {
        const lead = await this.leadAutomationService.processIncomingLead(leadData);
        return { success: true, leadId: lead.id };
      }

      return { success: true, message: 'No lead data extracted' };
    } catch (error) {
      this.logger.error('Error processing WhatsApp lead', error);
      throw error;
    }
  }

  /**
   * Generic Landing Page Form Webhook
   */
  @Post('landing-page')
  async handleLandingPageLead(@Body() payload: any, @Headers() headers: any) {
    try {
      this.logger.log('Received landing page lead', payload);

      const leadData = this.parseLandingPageForm(payload);
      const lead = await this.leadAutomationService.processIncomingLead(leadData);

      return { success: true, leadId: lead.id };
    } catch (error) {
      this.logger.error('Error processing landing page lead', error);
      throw error;
    }
  }

  /**
   * Zapier/Third-party Integration Webhook
   */
  @Post('zapier')
  async handleZapierLead(@Body() payload: any) {
    try {
      this.logger.log('Received Zapier lead', payload);

      const leadData = this.parseZapierLead(payload);
      const lead = await this.leadAutomationService.processIncomingLead(leadData);

      return { success: true, leadId: lead.id };
    } catch (error) {
      this.logger.error('Error processing Zapier lead', error);
      throw error;
    }
  }

  /**
   * Parse Facebook Lead Ads payload
   */
  private parseFacebookLead(payload: any): AutoLeadData {
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const leadgenData = changes?.value;

    return {
      fullName: leadgenData.field_data?.find((f: any) => f.name === 'full_name')?.values?.[0] || 'Unknown',
      email: leadgenData.field_data?.find((f: any) => f.name === 'email')?.values?.[0],
      phone: leadgenData.field_data?.find((f: any) => f.name === 'phone_number')?.values?.[0],
      source: LeadSource.FACEBOOK_ADS,
      sourceDetails: `Facebook Lead Ad - Form ID: ${leadgenData.form_id}`,
      campaignId: leadgenData.ad_id,
      campaignName: leadgenData.campaign_name || 'Facebook Campaign',
      adSetName: leadgenData.adset_name,
      adName: leadgenData.ad_name,
      interests: leadgenData.field_data?.find((f: any) => f.name === 'interests')?.values?.join(', '),
      budgetRange: this.parseBudgetFromText(leadgenData.field_data?.find((f: any) => f.name === 'budget')?.values?.[0]),
      initialNotes: `Lead from Facebook Ad: ${leadgenData.ad_name || 'Unknown Ad'}`,
    };
  }

  /**
   * Parse Google Ads lead payload
   */
  private parseGoogleAdsLead(payload: any): AutoLeadData {
    return {
      fullName: payload.name || 'Unknown',
      email: payload.email,
      phone: payload.phone,
      source: LeadSource.GOOGLE_ADS,
      sourceDetails: `Google Ads Lead Form - Campaign: ${payload.campaign_name}`,
      campaignId: payload.campaign_id,
      campaignName: payload.campaign_name,
      adSetName: payload.ad_group_name,
      interests: payload.interests,
      budgetRange: this.parseBudgetFromText(payload.budget),
      initialNotes: `Lead from Google Ads campaign: ${payload.campaign_name}`,
      utmSource: payload.utm_source,
      utmMedium: payload.utm_medium,
      utmCampaign: payload.utm_campaign,
    };
  }

  /**
   * Parse WhatsApp message for lead extraction
   */
  private parseWhatsAppMessage(payload: any): AutoLeadData | null {
    const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return null;

    const contact = payload.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];
    const messageText = message.text?.body || '';

    // Simple lead detection - customize based on your needs
    const isLeadInquiry = this.detectLeadInquiry(messageText);
    if (!isLeadInquiry) return null;

    return {
      fullName: contact?.profile?.name || 'WhatsApp User',
      phone: message.from,
      source: LeadSource.WHATSAPP,
      sourceDetails: `WhatsApp Business inquiry`,
      initialNotes: `WhatsApp message: "${messageText}"`,
      interests: this.extractInterestsFromText(messageText),
      budgetRange: this.parseBudgetFromText(messageText),
    };
  }

  /**
   * Parse landing page form submission
   */
  private parseLandingPageForm(payload: any): AutoLeadData {
    return {
      fullName: payload.name || payload.full_name || 'Unknown',
      email: payload.email,
      phone: payload.phone || payload.phone_number,
      source: LeadSource.WEBSITE,
      sourceDetails: `Landing page form submission - Page: ${payload.page_url || 'Unknown'}`,
      interests: payload.interests || payload.message,
      budgetRange: this.parseBudgetFromText(payload.budget),
      initialNotes: payload.message || payload.comments || 'Landing page inquiry',
      utmSource: payload.utm_source,
      utmMedium: payload.utm_medium,
      utmCampaign: payload.utm_campaign,
      utmContent: payload.utm_content,
      referrerUrl: payload.referrer,
      ipAddress: payload.ip_address,
      userAgent: payload.user_agent,
    };
  }

  /**
   * Parse Zapier/third-party integration payload
   */
  private parseZapierLead(payload: any): AutoLeadData {
    return {
      fullName: payload.name || payload.full_name || 'Unknown',
      email: payload.email,
      phone: payload.phone,
      source: this.mapZapierSource(payload.source),
      sourceDetails: `Zapier integration - Source: ${payload.source}`,
      campaignName: payload.campaign_name,
      interests: payload.interests || payload.message,
      budgetRange: this.parseBudgetFromText(payload.budget),
      initialNotes: payload.notes || payload.message || 'Zapier integration lead',
    };
  }

  /**
   * Detect if WhatsApp message is a lead inquiry
   */
  private detectLeadInquiry(message: string): boolean {
    const leadKeywords = [
      'plot', 'house', 'buy', 'purchase', 'invest', 'price', 'cost',
      'available', 'booking', 'interested', 'information', 'details'
    ];
    
    const lowerMessage = message.toLowerCase();
    return leadKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Extract interests from message text
   */
  private extractInterestsFromText(text: string): string {
    const interests: string[] = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('5 marla')) interests.push('5 marla');
    if (lowerText.includes('10 marla')) interests.push('10 marla');
    if (lowerText.includes('1 kanal')) interests.push('1 kanal');
    if (lowerText.includes('corner')) interests.push('corner plot');
    if (lowerText.includes('phase 1')) interests.push('Phase 1');
    if (lowerText.includes('phase 2')) interests.push('Phase 2');
    
    return interests.join(', ');
  }

  /**
   * Parse budget amount from text
   */
  private parseBudgetFromText(text: string): number | undefined {
    if (!text) return undefined;
    
    const budgetMatch = text.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:lakh|crore|million)?/i);
    if (budgetMatch) {
      const amount = parseFloat(budgetMatch[1].replace(/,/g, ''));
      
      if (text.toLowerCase().includes('crore')) {
        return amount * 10000000; // Convert crores to PKR
      } else if (text.toLowerCase().includes('lakh')) {
        return amount * 100000; // Convert lakhs to PKR
      } else if (text.toLowerCase().includes('million')) {
        return amount * 1000000; // Convert millions to PKR
      }
      
      return amount;
    }
    
    return undefined;
  }

  /**
   * Map Zapier source to LeadSource enum
   */
  private mapZapierSource(source: string): LeadSource {
    const sourceMap: { [key: string]: LeadSource } = {
      'facebook': LeadSource.FACEBOOK_ADS,
      'google': LeadSource.GOOGLE_ADS,
      'whatsapp': LeadSource.WHATSAPP,
      'website': LeadSource.WEBSITE,
      'referral': LeadSource.REFERRAL,
    };
    
    return sourceMap[source?.toLowerCase()] || LeadSource.OTHER;
  }

  /**
   * Verify Facebook webhook signature (implement proper verification)
   */
  private verifyFacebookWebhook(payload: any, headers: any): boolean {
    // Implement Facebook webhook signature verification
    // For now, return true (implement proper verification in production)
    return true;
  }

  /**
   * Verify WhatsApp webhook signature
   */
  private verifyWhatsAppWebhook(payload: any, headers: any): boolean {
    // Implement WhatsApp webhook signature verification
    // For now, return true (implement proper verification in production)
    return true;
  }
}

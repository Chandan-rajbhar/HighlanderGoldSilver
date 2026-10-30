import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';
import { BUSINESS_INFO } from '../data/businessInfo';

export interface CustomerInquiryPayload {
  fullName: string;
  email: string;
  phone?: string;
  inquiryType: string;
  productRef?: string;
  message: string;
}

export interface InquiryRecord extends CustomerInquiryPayload {
  id?: string;
  referenceId: string;
  createdAt: string;
  status: 'received' | 'processed' | 'New' | 'In Progress' | 'Replied' | 'Closed';
}

export class InquiryService {
  private static STORAGE_KEY = 'hgs_customer_inquiries';

  /**
   * Generates a unique numismatic reference identifier
   * e.g., HGS-INQ-482910
   */
  static generateReferenceId(): string {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `HGS-INQ-${randomSuffix}`;
  }

  /**
   * Submits a customer inquiry: persists to Supabase database, localDB,
   * localStorage, and returns structured result with mailto fallback.
   */
  static async submitInquiry(
    payload: CustomerInquiryPayload
  ): Promise<{ success: boolean; record: InquiryRecord; mailtoUrl: string }> {
    // Validate required fields
    if (!payload.fullName.trim()) {
      throw new Error('Full Name is required.');
    }
    if (!payload.email.trim() || !payload.email.includes('@')) {
      throw new Error('A valid email address is required.');
    }
    if (!payload.message.trim()) {
      throw new Error('Inquiry message is required.');
    }

    const referenceId = this.generateReferenceId();
    const shortId = Math.random().toString(36).substring(2, 10);
    const dbId = `inq-${shortId}`;

    const record: InquiryRecord = {
      ...payload,
      id: dbId,
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      phone: payload.phone?.trim() || undefined,
      productRef: payload.productRef?.trim() || undefined,
      message: payload.message.trim(),
      referenceId,
      createdAt: new Date().toISOString(),
      status: 'received'
    };

    // Clean mapped inquiry type to match Supabase definitions
    let mappedType = payload.inquiryType || 'General';
    if (mappedType.includes('Authentication') || mappedType.includes('Grading')) {
      mappedType = 'Authentication';
    } else if (mappedType.includes('Payment') || mappedType.includes('Order')) {
      mappedType = 'Order / Payment';
    } else if (mappedType.includes('Shipping')) {
      mappedType = 'Shipping';
    } else if (mappedType.includes('Product')) {
      mappedType = 'Product Inquiry';
    }

    const lotTitle = payload.productRef?.trim() || (mappedType !== 'General' ? `${mappedType} Inquiry` : 'General Inquiry');

    // Extract lot number if present in productRef (e.g. "Lot #101" or "#42")
    let lotNumber: string | null = null;
    if (payload.productRef) {
      const match = payload.productRef.match(/(?:lot\s*#?|#)\s*([A-Za-z0-9-]+)/i);
      if (match) {
        lotNumber = match[1];
      }
    }

    // Database row representation matching public.inquiries table schema
    const dbRow = {
      id: dbId,
      lot_number: lotNumber,
      lot_title: lotTitle,
      inquirer_name: payload.fullName.trim(),
      email: payload.email.trim(),
      phone: payload.phone?.trim() || null,
      inquiry_type: mappedType,
      message: payload.message.trim(),
      status: 'New',
      created_at: record.createdAt,
      updated_at: record.createdAt
    };

    // 1. Insert directly into Supabase public.inquiries table
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from('inquiries')
          .insert([dbRow]);
        if (error) {
          console.warn('Supabase inquiry insert warning:', error);
        } else {
          console.log('Inquiry successfully recorded in Supabase:', dbId);
        }
      } catch (dbErr) {
        console.error('Error inserting inquiry into Supabase:', dbErr);
      }
    }

    // 2. Persist to localDB so Admin Dashboard shows it in fallback mode
    try {
      const existingInqs = localDB.getInquiries();
      localDB.setInquiries([dbRow, ...existingInqs]);
    } catch (e) {
      console.warn('Unable to sync inquiry to localDB', e);
    }

    // 3. Persist to browser localStorage for client receipt
    try {
      const existing = localStorage.getItem(this.STORAGE_KEY);
      const inquiries: InquiryRecord[] = existing ? JSON.parse(existing) : [];
      inquiries.unshift(record);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(inquiries));
    } catch (e) {
      console.warn('Unable to persist inquiry to localStorage', e);
    }

    // 4. Generate mailto link for direct client transmission
    const subject = encodeURIComponent(
      `[${referenceId}] ${payload.inquiryType}${payload.productRef ? ` - ${payload.productRef}` : ''} - ${payload.fullName}`
    );
    const body = encodeURIComponent(
      `Hello Highlander Gold & Silver,\n\n` +
      `CUSTOMER INQUIRY (Ref: ${referenceId})\n` +
      `-----------------------------------------\n` +
      `From: ${payload.fullName}\n` +
      `Email: ${payload.email}\n` +
      `Phone: ${payload.phone || 'Not provided'}\n` +
      `Inquiry Type: ${payload.inquiryType}\n` +
      `Product/Item: ${payload.productRef || 'Not specified'}\n\n` +
      `Message:\n${payload.message}\n\n` +
      `-----------------------------------------\n` +
      `Submitted via highlandergoldandsilver.com`
    );
    const mailtoUrl = `mailto:${BUSINESS_INFO.email}?subject=${subject}&body=${body}`;

    return {
      success: true,
      record,
      mailtoUrl
    };
  }
}

export default InquiryService;

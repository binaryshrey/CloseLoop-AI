export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string;
          user_id: string;
          campaign_name: string;
          campaign_type: string;
          campaign_description: string | null;
          product_url: string | null;
          product_about_url: string | null;
          product_pricing_url: string | null;
          email_subject: string | null;
          email_body: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          campaign_name: string;
          campaign_type: string;
          campaign_description?: string | null;
          product_url?: string | null;
          product_about_url?: string | null;
          product_pricing_url?: string | null;
          email_subject?: string | null;
          email_body?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          campaign_name?: string;
          campaign_type?: string;
          campaign_description?: string | null;
          product_url?: string | null;
          product_about_url?: string | null;
          product_pricing_url?: string | null;
          email_subject?: string | null;
          email_body?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          campaign_id: string;
          name: string;
          about: string | null;
          email: string | null;
          phone: string | null;
          linkedin: string | null;
          twitter: string | null;
          f_score: number | null;
          reason: string | null;
          is_selected: boolean;
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          name: string;
          about?: string | null;
          email?: string | null;
          phone?: string | null;
          linkedin?: string | null;
          twitter?: string | null;
          f_score?: number | null;
          reason?: string | null;
          is_selected?: boolean;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          name?: string;
          about?: string | null;
          email?: string | null;
          phone?: string | null;
          linkedin?: string | null;
          twitter?: string | null;
          f_score?: number | null;
          reason?: string | null;
          is_selected?: boolean;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      call_logs: {
        Row: {
          id: string;
          campaign_id: string;
          lead_id: string;
          call_status: string;
          call_duration: number | null;
          confidence_score: number | null;
          transcript: string | null;
          recording_url: string | null;
          started_at: string;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          lead_id: string;
          call_status?: string;
          call_duration?: number | null;
          confidence_score?: number | null;
          transcript?: string | null;
          recording_url?: string | null;
          started_at?: string;
          ended_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          lead_id?: string;
          call_status?: string;
          call_duration?: number | null;
          confidence_score?: number | null;
          transcript?: string | null;
          recording_url?: string | null;
          started_at?: string;
          ended_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

// Helper types for easier use
export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type CampaignInsert = Database['public']['Tables']['campaigns']['Insert'];
export type CampaignUpdate = Database['public']['Tables']['campaigns']['Update'];

export type Lead = Database['public']['Tables']['leads']['Row'];
export type LeadInsert = Database['public']['Tables']['leads']['Insert'];
export type LeadUpdate = Database['public']['Tables']['leads']['Update'];

export type CallLog = Database['public']['Tables']['call_logs']['Row'];
export type CallLogInsert = Database['public']['Tables']['call_logs']['Insert'];
export type CallLogUpdate = Database['public']['Tables']['call_logs']['Update'];

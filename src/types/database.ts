export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      site_settings: {
        Row: {
          id: string;
          hero_headline: string;
          hero_subhead: string;
          primary_cta_text: string;
          secondary_cta_text: string;
          now_panel_items: Json;
          social_links: Json;
          seo_defaults: Json;
          feature_toggles: Json;
          site_name: string;
          owner_name: string;
          owner_initials: string;
          resume_content: Json;
          contact_page: Json;
          navigation_items: Json;
          games_config: Json;
          theme_config: Json;
          signals_badges: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hero_headline?: string;
          hero_subhead: string;
          primary_cta_text?: string;
          secondary_cta_text?: string;
          now_panel_items?: Json;
          social_links?: Json;
          seo_defaults?: Json;
          feature_toggles?: Json;
          site_name?: string;
          owner_name?: string;
          owner_initials?: string;
          resume_content?: Json;
          contact_page?: Json;
          navigation_items?: Json;
          games_config?: Json;
          theme_config?: Json;
          signals_badges?: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          hero_headline?: string;
          hero_subhead?: string;
          primary_cta_text?: string;
          secondary_cta_text?: string;
          now_panel_items?: Json;
          social_links?: Json;
          seo_defaults?: Json;
          feature_toggles?: Json;
          site_name?: string;
          owner_name?: string;
          owner_initials?: string;
          resume_content?: Json;
          contact_page?: Json;
          navigation_items?: Json;
          games_config?: Json;
          theme_config?: Json;
          signals_badges?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          title: string;
          slug: string;
          one_liner: string;
          problem: string | null;
          approach: string | null;
          impact: string | null;
          stack: string[];
          links: Json;
          build_notes: string | null;
          build_diagram_url: string | null;
          tradeoffs: string[];
          improvements: string[];
          cover_url: string | null;
          is_featured: boolean;
          sort_order: number;
          status: 'draft' | 'published' | 'archived';
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          one_liner: string;
          problem?: string | null;
          approach?: string | null;
          impact?: string | null;
          stack?: string[];
          links?: Json;
          build_notes?: string | null;
          build_diagram_url?: string | null;
          tradeoffs?: string[];
          improvements?: string[];
          cover_url?: string | null;
          is_featured?: boolean;
          sort_order?: number;
          status?: 'draft' | 'published' | 'archived';
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          one_liner?: string;
          problem?: string | null;
          approach?: string | null;
          impact?: string | null;
          stack?: string[];
          links?: Json;
          build_notes?: string | null;
          build_diagram_url?: string | null;
          tradeoffs?: string[];
          improvements?: string[];
          cover_url?: string | null;
          is_featured?: boolean;
          sort_order?: number;
          status?: 'draft' | 'published' | 'archived';
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          summary: string | null;
          body_md: string;
          tags: string[];
          cover_url: string | null;
          reading_time_minutes: number | null;
          status: 'draft' | 'published' | 'archived';
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          summary?: string | null;
          body_md: string;
          tags?: string[];
          cover_url?: string | null;
          reading_time_minutes?: number | null;
          status?: 'draft' | 'published' | 'archived';
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          summary?: string | null;
          body_md?: string;
          tags?: string[];
          cover_url?: string | null;
          reading_time_minutes?: number | null;
          status?: 'draft' | 'published' | 'archived';
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pages: {
        Row: {
          id: string;
          key: string;
          body_md: string;
          metadata: Json;
          status: 'draft' | 'published';
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          body_md: string;
          metadata?: Json;
          status?: 'draft' | 'published';
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          body_md?: string;
          metadata?: Json;
          status?: 'draft' | 'published';
          updated_at?: string;
        };
        Relationships: [];
      };
      redirects: {
        Row: {
          id: string;
          from_path: string;
          to_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_path: string;
          to_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_path?: string;
          to_path?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          table_name: string;
          row_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          table_name: string;
          row_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          table_name?: string;
          row_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          message: string;
          ip_hash: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          message: string;
          ip_hash?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          message?: string;
          ip_hash?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      content_revisions: {
        Row: {
          id: string;
          content_type: string;
          content_id: string;
          revision_number: number;
          data: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_type: string;
          content_id: string;
          revision_number: number;
          data: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          content_type?: string;
          content_id?: string;
          revision_number?: number;
          data?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      preview_tokens: {
        Row: {
          id: string;
          token: string;
          content_type: string;
          content_id: string;
          expires_at: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          token: string;
          content_type: string;
          content_id: string;
          expires_at: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          token?: string;
          content_type?: string;
          content_id?: string;
          expires_at?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      assets: {
        Row: {
          id: string;
          filename: string;
          original_url: string;
          bucket: string;
          mime_type: string;
          size_bytes: number | null;
          width: number | null;
          height: number | null;
          variants: Json;
          alt_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          filename: string;
          original_url: string;
          bucket: string;
          mime_type: string;
          size_bytes?: number | null;
          width?: number | null;
          height?: number | null;
          variants?: Json;
          alt_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          filename?: string;
          original_url?: string;
          bucket?: string;
          mime_type?: string;
          size_bytes?: number | null;
          width?: number | null;
          height?: number | null;
          variants?: Json;
          alt_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          role: 'admin' | 'editor';
          created_at: string;
        };
        Insert: {
          user_id: string;
          role?: 'admin' | 'editor';
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: 'admin' | 'editor';
          created_at?: string;
        };
        Relationships: [];
      };
      terminal_commands: {
        Row: {
          id: string;
          name: string;
          description: string;
          usage: string | null;
          category: string;
          output_type: 'text' | 'error' | 'success' | 'ascii' | 'list';
          output_content: string;
          output_items: string[] | null;
          is_system: boolean;
          is_enabled: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          usage?: string | null;
          category?: string;
          output_type?: 'text' | 'error' | 'success' | 'ascii' | 'list';
          output_content: string;
          output_items?: string[] | null;
          is_system?: boolean;
          is_enabled?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          usage?: string | null;
          category?: string;
          output_type?: 'text' | 'error' | 'success' | 'ascii' | 'list';
          output_content?: string;
          output_items?: string[] | null;
          is_system?: boolean;
          is_enabled?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Convenience type aliases
export type Project = Tables<'projects'>;
export type BlogPost = Tables<'blog_posts'>;
export type Page = Tables<'pages'>;
export type SiteSettings = Tables<'site_settings'>;
export type Redirect = Tables<'redirects'>;
export type ContactMessage = Tables<'contact_messages'>;
export type ContentRevision = Tables<'content_revisions'>;
export type PreviewToken = Tables<'preview_tokens'>;
export type Asset = Tables<'assets'>;
export type UserRole = Tables<'user_roles'>;
export type AuditLog = Tables<'audit_log'>;
export type TerminalCommand = Tables<'terminal_commands'>;

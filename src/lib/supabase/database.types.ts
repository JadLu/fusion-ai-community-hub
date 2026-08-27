/**
 * Hand-authored to match supabase/migrations/*.sql, and shaped like
 * `supabase gen types typescript` output (Tables/Views/Functions/Enums/
 * CompositeTypes, per-table Relationships) so @supabase/postgrest-js's
 * GenericSchema constraint resolves instead of silently falling back to
 * `never` — Relationships in particular is what lets embedded selects like
 * `.select("*, creator:profiles(...)")` type-check. Regenerate from a
 * live-linked project once one exists — that becomes the source of truth.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRole = "member" | "creator" | "admin";
export type WorkflowStatus = "draft" | "published" | "flagged" | "removed";
export type QaPostStatus = "open" | "solved";
export type ModerationTargetType = "workflow" | "qa_post" | "qa_reply";
export type ModerationStatus = "pending" | "resolved" | "dismissed";
export type VoteTargetType = "workflow" | "qa_post" | "qa_reply";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          github_url: string | null;
          google_linked: boolean;
          reputation: number;
          role: ProfileRole;
          verified_creator: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          github_url?: string | null;
          google_linked?: boolean;
          reputation?: number;
          role?: ProfileRole;
          verified_creator?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      reputation_badges: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          icon: string;
          tier: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description: string;
          icon: string;
          tier?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["reputation_badges"]["Insert"]
        >;
        Relationships: [];
      };
      profile_badges: {
        Row: {
          profile_id: string;
          badge_id: string;
          awarded_at: string;
        };
        Insert: {
          profile_id: string;
          badge_id: string;
          awarded_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["profile_badges"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "profile_badges_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_badges_badge_id_fkey";
            columns: ["badge_id"];
            isOneToOne: false;
            referencedRelation: "reputation_badges";
            referencedColumns: ["id"];
          },
        ];
      };
      workflows: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          slug: string;
          description: string;
          category: string;
          tags: string[];
          json_schema: Json;
          version: string;
          downloads: number;
          upvotes: number;
          status: WorkflowStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          slug: string;
          description?: string;
          category: string;
          tags?: string[];
          json_schema: Json;
          version?: string;
          downloads?: number;
          upvotes?: number;
          status?: WorkflowStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workflows"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "workflows_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      workflow_versions: {
        Row: {
          id: string;
          workflow_id: string;
          version: string;
          changelog: string | null;
          json_schema: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          version: string;
          changelog?: string | null;
          json_schema: Json;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["workflow_versions"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "workflow_versions_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflows";
            referencedColumns: ["id"];
          },
        ];
      };
      qa_posts: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          body: string;
          tags: string[];
          status: QaPostStatus;
          upvotes: number;
          accepted_reply_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          body: string;
          tags?: string[];
          status?: QaPostStatus;
          upvotes?: number;
          accepted_reply_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["qa_posts"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "qa_posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "qa_posts_accepted_reply_fkey";
            columns: ["accepted_reply_id"];
            isOneToOne: false;
            referencedRelation: "qa_replies";
            referencedColumns: ["id"];
          },
        ];
      };
      qa_replies: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          body: string;
          upvotes: number;
          is_solution: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          body: string;
          upvotes?: number;
          is_solution?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["qa_replies"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "qa_replies_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "qa_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "qa_replies_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      api_keys: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          key_prefix: string;
          key_hash: string;
          created_at: string;
          last_used_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          key_prefix: string;
          key_hash: string;
          created_at?: string;
          last_used_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["api_keys"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "api_keys_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      moderation_reports: {
        Row: {
          id: string;
          target_type: ModerationTargetType;
          target_id: string;
          reason: string;
          reported_by: string;
          status: ModerationStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          target_type: ModerationTargetType;
          target_id: string;
          reason: string;
          reported_by: string;
          status?: ModerationStatus;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["moderation_reports"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "moderation_reports_reported_by_fkey";
            columns: ["reported_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      workflow_comments: {
        Row: {
          id: string;
          workflow_id: string;
          author_id: string;
          parent_id: string | null;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          author_id: string;
          parent_id?: string | null;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["workflow_comments"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "workflow_comments_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflows";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "workflow_comments";
            referencedColumns: ["id"];
          },
        ];
      };
      votes: {
        Row: {
          target_type: VoteTargetType;
          target_id: string;
          voter_id: string;
          value: number;
          created_at: string;
        };
        Insert: {
          target_type: VoteTargetType;
          target_id: string;
          voter_id: string;
          value: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["votes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "votes_voter_id_fkey";
            columns: ["voter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      workflow_downloads: {
        Row: {
          id: string;
          workflow_id: string;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          user_id?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["workflow_downloads"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "workflow_downloads_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflows";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_downloads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      bookmarks: {
        Row: {
          profile_id: string;
          workflow_id: string;
          created_at: string;
        };
        Insert: {
          profile_id: string;
          workflow_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookmarks"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "bookmarks_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookmarks_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflows";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      profile_role: ProfileRole;
      workflow_status: WorkflowStatus;
      qa_post_status: QaPostStatus;
      moderation_target_type: ModerationTargetType;
      moderation_status: ModerationStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

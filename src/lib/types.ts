import type { Database } from "@/lib/supabase/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Workflow = Database["public"]["Tables"]["workflows"]["Row"];
export type WorkflowVersion =
  Database["public"]["Tables"]["workflow_versions"]["Row"];
export type QaPost = Database["public"]["Tables"]["qa_posts"]["Row"];
export type QaReply = Database["public"]["Tables"]["qa_replies"]["Row"];
export type ReputationBadge =
  Database["public"]["Tables"]["reputation_badges"]["Row"];
export type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"];
export type ModerationReport =
  Database["public"]["Tables"]["moderation_reports"]["Row"];
export type WorkflowComment =
  Database["public"]["Tables"]["workflow_comments"]["Row"];
export type Vote = Database["public"]["Tables"]["votes"]["Row"];
export type WorkflowDownload =
  Database["public"]["Tables"]["workflow_downloads"]["Row"];
export type Bookmark = Database["public"]["Tables"]["bookmarks"]["Row"];

export type WorkflowCategory =
  | "Sales"
  | "Dev"
  | "Marketing"
  | "Support"
  | "Ops"
  | "Data";

export interface WorkflowWithCreator extends Workflow {
  creator: Pick<Profile, "username" | "display_name" | "avatar_url" | "verified_creator">;
}

export interface QaPostWithAuthor extends QaPost {
  author: Pick<Profile, "username" | "display_name" | "avatar_url">;
  reply_count: number;
}

export interface CreatorProfile extends Profile {
  badges: ReputationBadge[];
  workflow_count: number;
}

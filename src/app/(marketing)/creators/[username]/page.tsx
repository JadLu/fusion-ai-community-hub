import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BadgeCheck, Star, Workflow as WorkflowIcon, Calendar } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkflowCard } from "@/components/shared/workflow-card";
import { GithubMark } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import type { ReputationBadge, WorkflowWithCreator } from "@/lib/types";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

async function getCreator(username: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
  if (!profile) return null;

  const [{ data: badgeRows }, { data: workflows }] = await Promise.all([
    supabase.from("profile_badges").select("reputation_badges(*)").eq("profile_id", profile.id),
    supabase
      .from("workflows")
      .select("*, creator:profiles!workflows_owner_id_fkey(username, display_name, avatar_url, verified_creator)")
      .eq("owner_id", profile.id)
      .eq("status", "published")
      .order("created_at", { ascending: false }),
  ]);

  const badges = (badgeRows ?? [])
    .map((r) => r.reputation_badges as unknown as ReputationBadge | null)
    .filter((b): b is ReputationBadge => b !== null);

  return { profile, badges, workflows: (workflows ?? []) as WorkflowWithCreator[] };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const creator = await getCreator(username);
  return { title: creator?.profile.display_name ?? "Creator" };
}

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const result = await getCreator(username);
  if (!result) notFound();
  const { profile, badges, workflows } = result;

  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <Avatar className="h-20 w-20 shrink-0">
          <AvatarFallback className="bg-secondary text-2xl font-semibold text-secondary-foreground">
            {initials(profile.display_name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{profile.display_name}</h1>
            {profile.verified_creator && (
              <Badge className="gap-1 border-platform-blue/20 bg-platform-blue/10 text-platform-blue hover:bg-platform-blue/10">
                <BadgeCheck className="h-3 w-3" aria-hidden /> Verified Creator
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {profile.bio && <p className="max-w-xl text-sm text-foreground/90">{profile.bio}</p>}
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5" aria-hidden /> {profile.reputation.toLocaleString()} reputation
            </span>
            <span className="flex items-center gap-1">
              <WorkflowIcon className="h-3.5 w-3.5" aria-hidden /> {workflows.length} workflows
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
            </span>
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-foreground"
              >
                <GithubMark className="h-3.5 w-3.5" /> GitHub
              </a>
            )}
          </div>
        </div>
      </div>

      {badges.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-3 text-sm font-semibold">Earned badges</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {badges.map((badge) => (
              <Card key={badge.id}>
                <CardContent className="flex flex-col gap-1 p-4">
                  <span className="category-label text-platform-purple">{badge.tier}</span>
                  <p className="text-sm font-semibold">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold">Published templates</h2>
        {workflows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            No published workflows yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

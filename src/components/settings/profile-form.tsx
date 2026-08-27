"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/actions/profile";
import type { Profile } from "@/lib/types";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
}

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const [displayName, setDisplayName] = React.useState(profile?.display_name ?? "");
  const [username, setUsername] = React.useState(profile?.username ?? "");
  const [bio, setBio] = React.useState(profile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = React.useState(profile?.avatar_url ?? "");
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile({
      displayName,
      username,
      bio,
      avatarUrl: avatarUrl.trim() || null,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error ?? "Could not save profile.");
      return;
    }
    toast.success("Profile updated.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border p-5">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
          <AvatarFallback className="bg-secondary text-lg font-semibold text-secondary-foreground">
            {initials(displayName || username)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="avatar-url">Avatar URL</Label>
          <Input
            id="avatar-url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="display-name">Display name</Label>
          <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="What do you build? What are you known for in the community?"
          maxLength={280}
        />
        <p className="text-right text-xs text-muted-foreground">{bio.length}/280</p>
      </div>

      <Button type="submit" className="gap-1.5" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
        Save changes
      </Button>
    </form>
  );
}

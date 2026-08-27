"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface CreateQaPostInput {
  title: string;
  body: string;
  tags: string[];
}

export interface CreateQaPostResult {
  ok: boolean;
  error?: string;
  postId?: string;
}

export async function createQaPost(input: CreateQaPostInput): Promise<CreateQaPostResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Connect a Supabase project to enable this — see the README." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to ask a question." };
  }
  if (input.title.trim().length < 5) {
    return { ok: false, error: "Title must be at least 5 characters." };
  }
  if (input.body.trim().length < 10) {
    return { ok: false, error: "Add a bit more detail to your question." };
  }

  const { data, error } = await supabase
    .from("qa_posts")
    .insert({
      author_id: user.id,
      title: input.title.trim(),
      body: input.body.trim(),
      tags: input.tags,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, postId: data.id };
}

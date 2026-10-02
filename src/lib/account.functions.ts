import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Signs in with a username + password without revealing the account's email to the browser. */
export const signInWithUsername = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        username: z.string().trim().min(1).max(60),
        password: z.string().min(1).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("username", data.username.replace(/^@/, ""))
      .maybeSingle();
    const invalid = { ok: false as const, error: "Invalid credentials. Please check and try again." };
    if (!profile) return invalid;
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    const email = authUser.user?.email;
    if (!email) return invalid;

    const client = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    });
    const { data: signed, error } = await client.auth.signInWithPassword({
      email,
      password: data.password,
    });
    if (error || !signed.session) return invalid;
    return {
      ok: true as const,
      access_token: signed.session.access_token,
      refresh_token: signed.session.refresh_token,
    };
  });

/** Permanently deletes the signed-in user's account and everything they own. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: files } = await supabaseAdmin.storage.from("class-media").list(context.userId, {
      limit: 1000,
    });
    if (files && files.length > 0) {
      await supabaseAdmin.storage
        .from("class-media")
        .remove(files.map((f) => `${context.userId}/${f.name}`));
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

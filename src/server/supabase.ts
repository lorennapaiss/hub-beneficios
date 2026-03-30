import "server-only";

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const requireEnv = (value: string | undefined, key: string) => {
  if (!value?.trim()) {
    throw new Error(`${key} nao definido.`);
  }
  return value;
};

export const getSupabaseAdminClient = () =>
  createClient(
    requireEnv(env.SUPABASE_URL, "SUPABASE_URL"),
    requireEnv(env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

const { createClient } = require('@supabase/supabase-js');

let adminClient;
let publicClient;

function getRealtimeOptions() {
  if (typeof WebSocket !== 'undefined') {
    return {};
  }

  return {
    realtime: {
      transport: require('ws')
    }
  };
}

function getSupabasePublicClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required');
  }

  if (!publicClient) {
    publicClient = createClient(supabaseUrl, publishableKey, {
      ...getRealtimeOptions(),
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return publicClient;
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      ...getRealtimeOptions(),
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return adminClient;
}

function getSupabaseConfigStatus() {
  return {
    configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    authConfigured: Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY)),
    urlConfigured: Boolean(process.env.SUPABASE_URL),
    publishableKeyConfigured: Boolean(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY),
    serviceRoleKeyConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  };
}

module.exports = {
  getSupabaseAdminClient,
  getSupabasePublicClient,
  getSupabaseConfigStatus
};

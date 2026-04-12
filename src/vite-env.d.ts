/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_CHESS_APP_URL?: string;
  readonly VITE_HUB_URL?: string;
  readonly VITE_FEATURE_HINTS?: string;
  readonly VITE_FEATURE_DAILY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

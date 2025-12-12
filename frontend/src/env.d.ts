/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_USE_MOCKS?: string
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
}

/// <reference types="vite/client" />

import type { SableApi } from './types';

declare global {
  interface Window {
    readonly sable: SableApi;
  }
}

export {};

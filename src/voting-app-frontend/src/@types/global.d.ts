

import type { HttpAgent } from '@dfinity/agent';
import type { Principal } from '@dfinity/principal';

// Definisikan tipe untuk objek Plug
interface IPlug {
  agent: HttpAgent;
  isConnected: () => Promise<boolean>;
  requestConnect: (config?: { whitelist: string[]; host?: string }) => Promise<void>;
  disconnect: () => Promise<void>;
  // Tambahkan metode lain yang mungkin Anda gunakan
}

// Perluas interface Window global
declare global {
  interface Window {
    ic?: {
      plug?: IPlug;
    };
  }
}

// Baris ini memastikan file ini diperlakukan sebagai module
export {};
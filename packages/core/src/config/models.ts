/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-pro';
export const DEFAULT_GEMINI_FLASH_MODEL = 'gemini-2.5-flash';
export const DEFAULT_GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';
// export const DEFAULT_OLLAMA_MODEL = 'mistral:7b'
export const DEFAULT_OLLAMA_MODEL = 'qwen3:1.7b';
export const DEFAULT_OLLAMA_EMBEDDING_MODEL = 'nomic-embed-text';

// Recommended Ollama models with good performance
export const RECOMMENDED_OLLAMA_MODELS = [
  // 'mistral:7b',
  'qwen3:1.7b',
  'gemma2:2b',
  'codellama:7b',
] as const;

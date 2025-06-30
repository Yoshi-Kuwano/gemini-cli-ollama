/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  OllamaContentGenerator,
  createOllamaContentGenerator,
} from './ollamaContentGenerator.js';
import { ContentGeneratorConfig, AuthType } from '../core/contentGenerator.js';
import { DEFAULT_OLLAMA_MODEL } from '../config/models.js';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock reportError
vi.mock('../utils/errorReporting.js', () => ({
  reportError: vi.fn(),
}));

describe('OllamaContentGenerator', () => {
  let generator: OllamaContentGenerator;
  let config: ContentGeneratorConfig;

  beforeEach(() => {
    config = {
      model: DEFAULT_OLLAMA_MODEL,
      authType: AuthType.USE_OLLAMA,
      ollamaHost: 'http://localhost:11434',
    };
    generator = new OllamaContentGenerator(config);
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateContent', () => {
    it('should generate content successfully', async () => {
      const mockResponse = {
        model: DEFAULT_OLLAMA_MODEL,
        created_at: '2023-01-01T00:00:00Z',
        response: 'Hello, world!',
        done: true,
        prompt_eval_count: 10,
        eval_count: 5,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const request = {
        model: DEFAULT_OLLAMA_MODEL,
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello' }],
          },
        ],
        config: {},
      };

      const result = await generator.generateContent(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"prompt":"Hello"'),
        }),
      );

      expect(result).toEqual({
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'Hello, world!' }],
            },
            finishReason: 'STOP',
            index: 0,
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
      });
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const request = {
        model: DEFAULT_OLLAMA_MODEL,
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello' }],
          },
        ],
        config: {},
      };

      await expect(generator.generateContent(request)).rejects.toThrow(
        'Failed to generate content with Ollama',
      );
    });
  });

  describe('countTokens', () => {
    it('should estimate token count', async () => {
      const request = {
        model: DEFAULT_OLLAMA_MODEL,
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello world' }], // 11 characters ≈ 3 tokens
          },
        ],
      };

      const result = await generator.countTokens(request);

      expect(result.totalTokens).toBe(3); // Math.ceil(11 / 4)
    });
  });

  describe('embedContent', () => {
    it('should generate embeddings successfully', async () => {
      const mockResponse = {
        embedding: [0.1, 0.2, 0.3],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const request = {
        model: 'nomic-embed-text',
        contents: ['Hello world'],
      };

      const result = await generator.embedContent(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/embeddings',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      expect(result).toEqual({
        embeddings: [{ values: [0.1, 0.2, 0.3] }],
      });
    });
  });

  describe('isAvailable', () => {
    it('should return true when Ollama is available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const result = await generator.isAvailable();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/tags',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('should return false when Ollama is not available', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await generator.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe('listModels', () => {
    it('should list available models', async () => {
      const mockResponse = {
        models: [
          {
            name: DEFAULT_OLLAMA_MODEL,
            modified_at: '2023-01-01T00:00:00Z',
            size: 1000,
            digest: 'abc123',
          },
          {
            name: 'codellama',
            modified_at: '2023-01-01T00:00:00Z',
            size: 2000,
            digest: 'def456',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await generator.listModels();

      expect(result).toEqual([DEFAULT_OLLAMA_MODEL, 'codellama']);
    });

    it('should return empty array when API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await generator.listModels();

      expect(result).toEqual([]);
    });
  });
});

describe('createOllamaContentGenerator', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create generator when Ollama is available', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
    });

    const config = {
      model: DEFAULT_OLLAMA_MODEL,
      authType: AuthType.USE_OLLAMA,
      ollamaHost: 'http://localhost:11434',
    };

    const generator = await createOllamaContentGenerator(config);

    expect(generator).toBeInstanceOf(OllamaContentGenerator);
  });

  it('should throw error when Ollama is not available', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

    const config = {
      model: DEFAULT_OLLAMA_MODEL,
      authType: AuthType.USE_OLLAMA,
      ollamaHost: 'http://localhost:11434',
    };

    await expect(createOllamaContentGenerator(config)).rejects.toThrow(
      'Ollama is not available at http://localhost:11434',
    );
  });
});

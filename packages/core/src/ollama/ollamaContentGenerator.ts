/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
  GenerateContentParameters,
  GenerateContentResponse,
  Part,
  FinishReason,
} from '@google/genai';
import {
  ContentGenerator,
  ContentGeneratorConfig,
} from '../core/contentGenerator.js';
import { reportError } from '../utils/errorReporting.js';
import { getErrorMessage } from '../utils/errors.js';
import {
  DEFAULT_OLLAMA_MODEL,
  RECOMMENDED_OLLAMA_MODELS,
} from '../config/models.js';

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    num_predict?: number;
  };
}

interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaEmbedRequest {
  model: string;
  prompt: string | string[];
}

interface OllamaEmbedResponse {
  embedding?: number[];
  embeddings?: number[][];
}

interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
}

interface OllamaListResponse {
  models: OllamaModel[];
}

export class OllamaContentGenerator implements ContentGenerator {
  private ollamaHost: string;
  private model: string;

  constructor(config: ContentGeneratorConfig) {
    this.ollamaHost = config.ollamaHost || 'http://localhost:11434';
    this.model = config.model || DEFAULT_OLLAMA_MODEL;
  }

  async generateContent(
    request: GenerateContentParameters,
  ): Promise<GenerateContentResponse> {
    try {
      const { prompt, systemInstruction } = this.convertToOllamaFormat(request);

      const ollamaRequest: OllamaGenerateRequest = {
        model: request.model || this.model,
        prompt,
        system: systemInstruction,
        stream: false,
        options: {
          temperature: request.config?.temperature,
          top_p: request.config?.topP,
          num_predict: request.config?.maxOutputTokens,
        },
      };

      const httpResponse = await fetch(`${this.ollamaHost}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ollamaRequest),
        signal: request.config?.abortSignal,
      });

      if (!httpResponse.ok) {
        throw new Error(
          `Ollama API error: ${httpResponse.status} ${httpResponse.statusText}`,
        );
      }

      const ollamaResponse: OllamaGenerateResponse = await httpResponse.json();

      // Convert Ollama response to Gemini format
      const response = new GenerateContentResponse();
      response.candidates = [
        {
          content: {
            role: 'model',
            parts: [{ text: ollamaResponse.response }],
          },
          finishReason: ollamaResponse.done
            ? FinishReason.STOP
            : FinishReason.MAX_TOKENS,
          index: 0,
        },
      ];
      response.usageMetadata = {
        promptTokenCount: ollamaResponse.prompt_eval_count,
        candidatesTokenCount: ollamaResponse.eval_count,
        totalTokenCount:
          (ollamaResponse.prompt_eval_count || 0) +
          (ollamaResponse.eval_count || 0),
      };
      return response;
    } catch (error) {
      await reportError(
        error,
        'Error generating content with Ollama',
        Array.isArray(request.contents) ? request.contents : [request.contents],
        'ollama-generate',
      );
      throw new Error(
        `Failed to generate content with Ollama: ${getErrorMessage(error)}`,
      );
    }
  }

  async generateContentStream(
    request: GenerateContentParameters,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    return this.doGenerateContentStream(request);
  }

  private async *doGenerateContentStream(
    request: GenerateContentParameters,
  ): AsyncGenerator<GenerateContentResponse> {
    try {
      const { prompt, systemInstruction } = this.convertToOllamaFormat(request);

      const ollamaRequest: OllamaGenerateRequest = {
        model: request.model || this.model,
        prompt,
        system: systemInstruction,
        stream: true,
        options: {
          temperature: request.config?.temperature,
          top_p: request.config?.topP,
          num_predict: request.config?.maxOutputTokens,
        },
      };

      const httpResponse = await fetch(`${this.ollamaHost}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ollamaRequest),
        signal: request.config?.abortSignal,
      });

      if (!httpResponse.ok) {
        throw new Error(
          `Ollama API error: ${httpResponse.status} ${httpResponse.statusText}`,
        );
      }

      const reader = httpResponse.body?.getReader();
      if (!reader) {
        throw new Error('No response body from Ollama');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const chunk: OllamaGenerateResponse = JSON.parse(line);
              const streamResponse = new GenerateContentResponse();
              streamResponse.candidates = [
                {
                  content: {
                    role: 'model',
                    parts: [{ text: chunk.response }],
                  },
                  finishReason: chunk.done ? FinishReason.STOP : undefined,
                  index: 0,
                },
              ];
              if (chunk.done) {
                streamResponse.usageMetadata = {
                  promptTokenCount: chunk.prompt_eval_count,
                  candidatesTokenCount: chunk.eval_count,
                  totalTokenCount:
                    (chunk.prompt_eval_count || 0) + (chunk.eval_count || 0),
                };
              }
              yield streamResponse;
            } catch (e) {
              console.error('Failed to parse Ollama stream chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      await reportError(
        error,
        'Error streaming content with Ollama',
        Array.isArray(request.contents) ? request.contents : [request.contents],
        'ollama-stream',
      );
      throw new Error(
        `Failed to stream content with Ollama: ${getErrorMessage(error)}`,
      );
    }
  }

  async countTokens(
    request: CountTokensParameters,
  ): Promise<CountTokensResponse> {
    // Ollama doesn't have a direct token counting API, so we'll estimate
    // based on the rule of thumb that 1 token ≈ 4 characters
    const fakeRequest: GenerateContentParameters = {
      contents: request.contents,
      model: request.model,
      config: {},
    };
    const { prompt } = this.convertToOllamaFormat(fakeRequest);
    const estimatedTokens = Math.ceil(prompt.length / 4);

    return {
      totalTokens: estimatedTokens,
    };
  }

  async embedContent(
    request: EmbedContentParameters,
  ): Promise<EmbedContentResponse> {
    try {
      // Handle different content types
      let texts: string[];
      if (Array.isArray(request.contents)) {
        // If it's an array, extract text from each item
        texts = request.contents.map((content) => {
          if (typeof content === 'string') {
            return content;
          } else if (
            content &&
            typeof content === 'object' &&
            'parts' in content &&
            content.parts
          ) {
            return this.extractTextFromParts(content.parts);
          }
          return '';
        });
      } else if (typeof request.contents === 'string') {
        texts = [request.contents];
      } else {
        texts = [''];
      }

      const ollamaRequest: OllamaEmbedRequest = {
        model: request.model || this.model,
        prompt: texts.length === 1 ? texts[0] : texts,
      };

      const response = await fetch(`${this.ollamaHost}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ollamaRequest),
      });

      if (!response.ok) {
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText}`,
        );
      }

      const ollamaResponse: OllamaEmbedResponse = await response.json();

      // Handle both single and multiple embeddings
      const embeddings =
        ollamaResponse.embeddings ||
        (ollamaResponse.embedding ? [ollamaResponse.embedding] : []);

      return {
        embeddings: embeddings.map((values) => ({ values })),
      };
    } catch (error) {
      await reportError(
        error,
        'Error generating embeddings with Ollama',
        Array.isArray(request.contents) ? request.contents : [request.contents],
        'ollama-embed',
      );
      throw new Error(
        `Failed to generate embeddings with Ollama: ${getErrorMessage(error)}`,
      );
    }
  }

  private convertToOllamaFormat(request: GenerateContentParameters): {
    prompt: string;
    systemInstruction?: string;
  } {
    let prompt = '';
    let systemInstruction: string | undefined;

    // Handle system instruction
    if (request.config?.systemInstruction) {
      if (typeof request.config.systemInstruction === 'string') {
        systemInstruction = request.config.systemInstruction;
      } else if (
        request.config.systemInstruction &&
        typeof request.config.systemInstruction === 'object' &&
        'parts' in request.config.systemInstruction &&
        request.config.systemInstruction.parts
      ) {
        systemInstruction = this.extractTextFromParts(
          request.config.systemInstruction.parts,
        );
      }
    }

    // Convert Gemini content format to Ollama prompt format
    const contents = Array.isArray(request.contents)
      ? request.contents
      : [request.contents];
    for (const content of contents) {
      if (typeof content === 'string') {
        prompt += content + '\n';
      } else if (
        content &&
        typeof content === 'object' &&
        'role' in content &&
        'parts' in content &&
        content.parts
      ) {
        const role = content.role;
        const text = this.extractTextFromParts(content.parts);

        if (role === 'user') {
          prompt += text + '\n';
        } else if (role === 'model') {
          prompt += `Assistant: ${text}\nHuman: `;
        }
      }
    }

    return { prompt: prompt.trim(), systemInstruction };
  }

  private extractTextFromParts(parts: Part[]): string {
    return parts
      .map((part) => {
        if ('text' in part) {
          return part.text;
        }
        // Handle other part types as needed
        return '';
      })
      .join('');
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.ollamaHost}/api/tags`);
      if (!response.ok) {
        throw new Error(`Failed to list Ollama models: ${response.status}`);
      }
      const data: OllamaListResponse = await response.json();
      return data.models.map((m) => m.name);
    } catch (error) {
      console.error('Failed to list Ollama models:', error);
      return [];
    }
  }

  async getAvailableModels(): Promise<string[]> {
    const installedModels = await this.listModels();

    // If we can get installed models, return them
    if (installedModels.length > 0) {
      return installedModels;
    }

    // Fallback to recommended models if Ollama is not available
    return [...RECOMMENDED_OLLAMA_MODELS];
  }

  async getBestAvailableModel(): Promise<string> {
    const availableModels = await this.getAvailableModels();

    // Try to find the configured default model first
    if (availableModels.includes(DEFAULT_OLLAMA_MODEL)) {
      return DEFAULT_OLLAMA_MODEL;
    }

    // Try recommended models in order of preference
    for (const model of RECOMMENDED_OLLAMA_MODELS) {
      if (availableModels.includes(model)) {
        return model;
      }
    }

    // Use the first available model
    return availableModels[0] || DEFAULT_OLLAMA_MODEL;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaHost}/api/tags`, {
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export async function createOllamaContentGenerator(
  config: ContentGeneratorConfig,
): Promise<ContentGenerator> {
  const generator = new OllamaContentGenerator(config);

  // Check if Ollama is available
  const available = await generator.isAvailable();
  if (!available) {
    throw new Error(
      `Ollama is not available at ${config.ollamaHost || 'http://localhost:11434'}. ` +
        'Please ensure Ollama is running and accessible.',
    );
  }

  return generator;
}

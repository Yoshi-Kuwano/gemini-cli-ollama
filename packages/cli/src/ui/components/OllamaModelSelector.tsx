/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Colors } from '../colors.js';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';
import { LoadingIndicator } from './LoadingIndicator.js';

interface OllamaModelSelectorProps {
  onSelect: (model: string) => void;
  onCancel: () => void;
  ollamaHost?: string;
}

interface ModelOption {
  label: string;
  value: string;
}

export function OllamaModelSelector({
  onSelect,
  onCancel,
  ollamaHost = 'http://localhost:11434',
}: OllamaModelSelectorProps): React.JSX.Element {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(`${ollamaHost}/api/tags`);
        if (!response.ok) {
          throw new Error(`Failed to fetch models: ${response.status}`);
        }
        const data = await response.json();
        const modelOptions: ModelOption[] = data.models.map(
          (model: { name: string; size: number }) => ({
            label: `${model.name} (${formatSize(model.size)})`,
            value: model.name,
          }),
        );

        if (modelOptions.length === 0) {
          setError(
            'No models found. Please install models using "ollama pull <model>"',
          );
        } else {
          setModels(modelOptions);
        }
      } catch (_err) {
        setError(
          'Could not connect to Ollama. Make sure Ollama is running on ' +
            ollamaHost,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [ollamaHost]);

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    }
  });

  const formatSize = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) {
      return `${gb.toFixed(1)}GB`;
    }
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)}MB`;
  };

  if (loading) {
    return (
      <Box
        borderStyle="round"
        borderColor={Colors.Gray}
        flexDirection="column"
        padding={1}
        width="100%"
      >
        <Text bold>Loading Ollama Models...</Text>
        <Box marginTop={1}>
          <LoadingIndicator elapsedTime={0} />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        borderStyle="round"
        borderColor={Colors.AccentRed}
        flexDirection="column"
        padding={1}
        width="100%"
      >
        <Text bold color={Colors.AccentRed}>
          Error Loading Models
        </Text>
        <Box marginTop={1}>
          <Text>{error}</Text>
        </Box>
        <Box marginTop={1}>
          <Text color={Colors.Gray}>Suggested commands:</Text>
        </Box>
        <Box marginTop={1}>
          <Text color={Colors.AccentBlue}>ollama pull qwen3:1.7b</Text>
        </Box>
        <Box marginTop={1}>
          <Text color={Colors.AccentBlue}>ollama pull gemma2:2b</Text>
        </Box>
        <Box marginTop={1}>
          <Text color={Colors.Gray}>(Press Escape to cancel)</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      borderStyle="round"
      borderColor={Colors.Gray}
      flexDirection="column"
      padding={1}
      width="100%"
    >
      <Text bold>Select Ollama Model</Text>
      <RadioButtonSelect
        items={models}
        initialIndex={0}
        onSelect={onSelect}
        onHighlight={() => {}} // No highlighting needed
        isFocused={true}
      />
      <Box marginTop={1}>
        <Text color={Colors.Gray}>(Use Enter to select, Escape to cancel)</Text>
      </Box>
    </Box>
  );
}

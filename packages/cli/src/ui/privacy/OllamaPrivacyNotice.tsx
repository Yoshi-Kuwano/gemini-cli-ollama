/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../colors.js';

interface OllamaPrivacyNoticeProps {
  onExit: () => void;
}

export function OllamaPrivacyNotice({
  onExit: _onExit,
}: OllamaPrivacyNoticeProps): React.JSX.Element {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={Colors.Gray}
      padding={1}
    >
      <Text bold color={Colors.AccentBlue}>
        Ollama Privacy Notice
      </Text>
      <Box marginTop={1}>
        <Text>You are using Ollama for local LLM inference.</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text>• All processing happens locally on your machine</Text>
        <Text>• No data is sent to external servers</Text>
        <Text>• Your conversations remain private and on your device</Text>
        <Text>• Model performance depends on your hardware capabilities</Text>
      </Box>
      <Box marginTop={1}>
        <Text color={Colors.Gray}>
          Ensure you have Ollama running at{' '}
          {process.env.OLLAMA_HOST || 'http://localhost:11434'}
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text>
          Learn more about Ollama at{' '}
          <Text color={Colors.AccentBlue}>https://ollama.ai</Text>
        </Text>
      </Box>
    </Box>
  );
}

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { LoadedSettings, SettingScope } from '../../config/settings.js';
import { Config } from '@google/gemini-cli-core';
import { UseHistoryManagerReturn } from './useHistoryManager.js';
import { MessageType } from '../types.js';

export function useModelCommand(
  settings: LoadedSettings,
  setModelError: (error: string | null) => void,
  config: Config | null,
  addItem: UseHistoryManagerReturn['addItem'],
) {
  const [showModelSelector, setShowModelSelector] = useState(false);

  const openModelDialog = useCallback(() => {
    setModelError(null);
    setShowModelSelector(true);
  }, [setModelError]);

  const closeModelDialog = useCallback(() => {
    setShowModelSelector(false);
  }, []);

  const handleModelSelect = useCallback(
    async (selectedModel: string) => {
      try {
        // Save the selected model to settings
        settings.setValue(SettingScope.User, 'ollamaModel', selectedModel);

        // Update the current model in config if possible
        if (config && typeof config.setModel === 'function') {
          config.setModel(selectedModel);
        }

        // Add a success message
        addItem({
          type: MessageType.INFO,
          text: `Successfully switched to Ollama model: ${selectedModel}`,
        }, Date.now());

        setShowModelSelector(false);
        setModelError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setModelError(`Failed to save model selection: ${errorMessage}`);
        addItem({
          type: MessageType.ERROR,
          text: `Failed to switch model: ${errorMessage}`,
        }, Date.now());
      }
    },
    [settings, config, addItem, setModelError],
  );

  return {
    showModelSelector,
    openModelDialog,
    closeModelDialog,
    handleModelSelect,
  };
}
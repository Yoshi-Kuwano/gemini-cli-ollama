# Using Gemini CLI with Ollama

This document describes how to use the Gemini CLI with Ollama for local LLM inference.

## Prerequisites

1. **Install Ollama**: Download and install Ollama from [https://ollama.ai](https://ollama.ai)

2. **Download a Model**: Pull a model to use with Ollama

   ```bash
   ollama pull qwen3:1.7b
   ollama pull codellama
   ollama pull mistral
   ```

3. **Start Ollama**: Ensure Ollama is running
   ```bash
   ollama serve
   ```
   By default, Ollama runs on `http://localhost:11434`

## Configuration

### Environment Variables

You can configure Ollama settings using environment variables:

- `OLLAMA_HOST`: The host where Ollama is running (default: `http://localhost:11434`)
- `OLLAMA_MODEL`: The default model to use (default: `llama2`)

Example `.env` file:

```env
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=codellama
```

### Using Ollama with Gemini CLI

1. **Start the CLI**: Run the Gemini CLI as usual

   ```bash
   gemini
   ```

2. **Select Ollama**: When prompted for authentication method, select "Ollama (Local)"

3. **Start Chatting**: The CLI will connect to your local Ollama instance and use the configured model

## Features

- **Local Processing**: All inference happens on your machine
- **Privacy**: No data is sent to external servers
- **Model Selection**: Supports any model available in your Ollama installation
- **Streaming**: Real-time streaming responses
- **Tool Support**: Full compatibility with Gemini CLI tools (file operations, web search, etc.)

## Supported Models

Ollama supports many popular models:

- qwen3:1.7b
- Code Llama (codellama)
- Mistral (mistral)
- Dolphin Phi (dolphin-phi)
- And many more...

Check available models with:

```bash
ollama list
```

## Performance Considerations

- **Hardware Requirements**: Larger models require more RAM and processing power
- **Model Size**: Consider using smaller models for faster responses on limited hardware
- **Concurrent Usage**: Ollama can handle multiple requests but performance may vary

## Troubleshooting

### Ollama Not Available

If you see "Ollama is not available", ensure:

1. Ollama is installed and running (`ollama serve`)
2. The correct host is configured in `OLLAMA_HOST`
3. No firewall is blocking the connection

### Model Not Found

If you get model errors:

1. Check available models: `ollama list`
2. Pull the required model: `ollama pull <model-name>`
3. Update `OLLAMA_MODEL` environment variable

### Performance Issues

For better performance:

1. Use smaller models for faster inference
2. Ensure sufficient RAM is available
3. Consider using GPU acceleration if supported

## Example Usage

```bash
# Set environment variables
export OLLAMA_HOST=http://localhost:11434
export OLLAMA_MODEL=codellama

# Start Gemini CLI
gemini

# Select "Ollama (Local)" when prompted
# Start chatting with your local model!
```

## Privacy Benefits

Using Ollama with Gemini CLI provides:

- **Complete Privacy**: No data leaves your machine
- **Offline Capability**: Works without internet connection
- **Data Control**: You control all aspects of data processing
- **No API Costs**: No usage fees or rate limits

Enjoy using Gemini CLI with the power and privacy of local LLM inference!

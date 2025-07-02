# Gemini CLI with Ollama Support

[![Gemini CLI CI](https://github.com/google-gemini/gemini-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/google-gemini/gemini-cli/actions/workflows/ci.yml)

![Gemini CLI Screenshot](./docs/assets/gemini-screenshot.png)

This repository contains the Gemini CLI with enhanced **Ollama support**, a command-line AI workflow tool that connects to your tools, understands your code and accelerates your workflows using both cloud and local AI models.

With the Gemini CLI you can:

- **Run completely offline** with local Ollama models (qwen3:1.7b, gemma2:2b, phi3:3.8b, etc.)
- Query and edit large codebases in and beyond Gemini's 1M token context window.
- Generate new apps from PDFs or sketches, using Gemini's multimodal capabilities.
- Automate operational tasks, like querying pull requests or handling complex rebases.
- Use tools and MCP servers to connect new capabilities, including [media generation with Imagen,
  Veo or Lyria](https://github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/mcp-genmedia)
- Ground your queries with the [Google Search](https://ai.google.dev/gemini-api/docs/grounding)
  tool, built in to Gemini.
- **Switch between multiple AI providers**: Google Gemini, Vertex AI, and local Ollama models.

## Quickstart

### Option 1: Local AI with Ollama (Recommended - No API Key Required!)

1. **Prerequisites:**
   - Ensure you have [Node.js version 18](https://nodejs.org/en/download) or higher installed
   - Install [Ollama](https://ollama.ai) from https://ollama.ai

2. **Setup Ollama:**

   ```bash
   # Install a lightweight, fast model
   ollama pull qwen3:1.7b

   # Or try other excellent models
   ollama pull gemma2:2b
   ollama pull phi3:3.8b

   # Start Ollama service
   ollama serve
   ```

3. **Run the CLI:**

   ```bash
   # Clone this enhanced version
   git clone https://github.com/your-repo/gemini-cli-ollama
   cd gemini-cli-ollama
   npm install
   npm run build
   npm start
   ```

4. **Authenticate:** When prompted, select **"Ollama (Local)"** - no API key needed!

5. **Select Model:** Use `/model` command to choose from your installed Ollama models

You are now ready to use the Gemini CLI completely offline!

### Option 2: Cloud AI with Google Gemini

1. **Prerequisites:** Ensure you have [Node.js version 18](https://nodejs.org/en/download) or higher installed.
2. **Run the CLI:** Execute the following command in your terminal:

   ```bash
   npx https://github.com/google-gemini/gemini-cli
   ```

   Or install it with:

   ```bash
   npm install -g @google/gemini-cli
   gemini
   ```

3. **Pick a color theme**
4. **Authenticate:** When prompted, sign in with your personal Google account. This will grant you up to 60 model requests per minute and 1,000 model requests per day using Gemini.

You are now ready to use the Gemini CLI!

### For advanced use or increased limits:

If you need to use a specific model or require a higher request capacity, you can use an API key:

1. Generate a key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Set it as an environment variable in your terminal. Replace `YOUR_API_KEY` with your generated key.

   ```bash
   export GEMINI_API_KEY="YOUR_API_KEY"
   ```

For other authentication methods, including Google Workspace accounts, see the [authentication](./docs/cli/authentication.md) guide.

## Ollama Features

### Supported Models

This CLI works with any Ollama model, including:

- **qwen3:1.7b** - Fast, lightweight, excellent for general tasks (default)
- **gemma2:2b** - Google's Gemma model, great balance of speed and capability
- **phi3:3.8b** - Microsoft's Phi-3 model, strong reasoning capabilities
- **llama3.2:3b** - Meta's Llama model, well-rounded performance
- **codellama:7b** - Specialized for code generation and analysis
- **mistral:7b** - Excellent instruction following

### Ollama-Specific Commands

- `/model` - Switch between installed Ollama models
- `/auth` - Change authentication method (switch between Ollama/Gemini/Vertex AI)

### Ollama Configuration

You can configure the Ollama host and port in multiple ways:

#### Method 1: Environment Variables

```bash
# Optional: Customize Ollama host (default: http://localhost:11434)
export OLLAMA_HOST=http://localhost:11434

# Optional: Set default model (default: qwen3:1.7b)
export OLLAMA_MODEL=gemma2:2b
```

#### Method 2: Settings File (Recommended)

Create or modify your settings file to configure Ollama persistently:

**User settings:** `~/.gemini/settings.json`
**Workspace settings:** `<project>/.gemini/settings.json`

```json
{
  "ollamaHost": "http://localhost:11434",
  "ollamaModel": "qwen3:1.7b"
}
```

#### Method 3: Remote Ollama Server

For remote Ollama instances (e.g., different machine, Docker container):

```json
{
  "ollamaHost": "http://192.168.1.100:11434",
  "ollamaModel": "gemma2:2b"
}
```

Or with environment variables:

```bash
export OLLAMA_HOST=http://192.168.1.100:11434
export OLLAMA_MODEL=gemma2:2b
```

#### Configuration Priority

The CLI uses this priority order:

1. **Settings file** (highest priority)
2. **Environment variables**
3. **Default values** (http://localhost:11434, qwen3:1.7b)

#### Testing Your Configuration

```bash
# Test if your Ollama host is accessible
curl ${OLLAMA_HOST:-http://localhost:11434}/api/tags

# Verify in the CLI
npm start
# Use /model command to see available models from your configured host
```

### Model Installation Guide

```bash
# Install recommended models
ollama pull qwen3:1.7b      # Lightweight, fast (1.7GB)
ollama pull gemma2:2b       # Google's efficient model (2GB)
ollama pull phi3:3.8b       # Strong reasoning (3.8GB)

# Code-focused models
ollama pull codellama:7b    # Specialized for programming (7GB)

# Larger, more capable models
ollama pull llama3.2:8b     # Meta's latest (8GB)
ollama pull mistral:7b      # Excellent instruction following (7GB)

# List installed models
ollama list

# Check model info
ollama show qwen3:1.7b
```

### Adding New Models to Recommendations

The CLI automatically detects all installed Ollama models via the `/api/tags` endpoint. However, if you want to add models to the **recommended models list** that appears when Ollama is not available, edit this file:

**File to modify:** `packages/core/src/config/models.ts`

```typescript
// Add your model to this array
export const RECOMMENDED_OLLAMA_MODELS = [
  'qwen3:1.7b', // Current default
  'gemma2:2b',
  'llama3.2:3b',
  'phi3:3.8b',
  'codellama:7b',
  'mistral:7b',
  'your-new-model:size', // ← Add your model here
] as const;
```

**To change the default model:**

```typescript
// Change this line in the same file
export const DEFAULT_OLLAMA_MODEL = 'your-preferred-model:size';
```

**After making changes:**

```bash
# Rebuild the CLI
npm run build

# The new models will appear in /model selection
npm start
```

**Note:** The CLI will show ALL installed models from `ollama list`, regardless of the config file. The `RECOMMENDED_OLLAMA_MODELS` array is only used as a fallback when Ollama is not running.

## Examples

Once the CLI is running, you can start interacting with AI models from your shell.

### Using Local Ollama Models

You can start a project from a new directory:

```sh
cd new-project/
npm start  # or use the built CLI
# Select "Ollama (Local)" authentication
# Use /model to select your preferred model (e.g., qwen3:1.7b)
> Write me a Discord bot that answers questions using a FAQ.md file I will provide
```

Or work with an existing project:

```sh
git clone https://github.com/your-repo/gemini-cli-ollama
cd gemini-cli-ollama
npm start
# Select "Ollama (Local)" authentication
> Give me a summary of all of the changes that went in yesterday
```

### Switching Between Models

```sh
# In the CLI, use slash commands:
/model                    # Opens model selection dialog
/auth                     # Switch between Ollama/Gemini/Vertex AI
/help                     # Show all available commands
```

### Switching Authentication Methods

The CLI automatically selects Ollama (Local) if available, but you can easily switch to other AI providers:

#### Using the /auth Command (Recommended)

1. **Start the CLI:**

   ```bash
   npm start
   ```

2. **Switch authentication method:**

   ```sh
   # Type this in the CLI
   /auth
   ```

3. **Select your preferred provider:**
   - **Ollama (Local)** - No API key required, runs offline
   - **Google Personal Account** - Sign in with your Google account (60 requests/min)
   - **Gemini API Key** - Use your API key for higher limits
   - **Vertex AI** - For enterprise/Google Cloud users

4. **Follow the authentication flow** for your selected method

#### Pre-configuring Authentication

You can also set your preferred authentication method before starting:

**Option 1: Environment Variables**

```bash
# For Gemini API Key
export GEMINI_API_KEY="your-api-key-here"
npm start  # Will automatically use Gemini

# For Vertex AI
export GOOGLE_API_KEY="your-service-account-key"
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"
npm start  # Will automatically use Vertex AI
```

**Option 2: Settings File**

```json
{
  "selectedAuthType": "gemini-api-key"
}
```

Available auth types:

- `"ollama"` - Ollama (Local)
- `"oauth-personal"` - Google Personal Account
- `"gemini-api-key"` - Gemini API Key
- `"vertex-ai"` - Vertex AI

#### Authentication Priority

The CLI automatically selects authentication in this order:

1. **Settings file** configuration
2. **Ollama** (if available and models installed)
3. **Gemini API Key** (if GEMINI_API_KEY is set)
4. **Vertex AI** (if Google Cloud variables are set)
5. **Google Personal Account** (default fallback)

**Tip:** Use `/auth` anytime during your session to switch between different AI providers without restarting the CLI!

### Local Development Benefits

- ✅ **No API costs** - Run unlimited queries locally
- ✅ **Privacy first** - Your code never leaves your machine
- ✅ **Offline capable** - Work without internet connection
- ✅ **Fast response** - Local models respond instantly
- ✅ **Multiple models** - Switch between different model strengths

### Next steps

- Learn how to [contribute to or build from the source](./CONTRIBUTING.md).
- Explore the available **[CLI Commands](./docs/cli/commands.md)**.
- If you encounter any issues, review the **[Troubleshooting guide](./docs/troubleshooting.md)**.
- For more comprehensive documentation, see the [full documentation](./docs/index.md).
- Take a look at some [popular tasks](#popular-tasks) for more inspiration.

### Troubleshooting

#### Ollama Issues

**Ollama not connecting:**

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama if not running
ollama serve

# Check installed models
ollama list
```

**Model not found:**

```bash
# Install the default model
ollama pull qwen3:1.7b

# Or install your preferred model
ollama pull gemma2:2b
```

**Permission issues:**

```bash
# On macOS/Linux, you might need to allow Ollama in System Preferences
# Check Ollama logs:
ollama logs
```

#### General Issues

Head over to the [troubleshooting](docs/troubleshooting.md) guide if you're
having other issues.

## Popular tasks

### Explore a new codebase

Start by `cd`ing into an existing or newly-cloned repository and running the CLI. With Ollama, you can explore without any privacy concerns since everything runs locally!

```text
> Describe the main pieces of this system's architecture.
```

```text
> What security mechanisms are in place?
```

### Code analysis with local models

Perfect for sensitive codebases that shouldn't leave your network:

```text
> Review this code for potential security vulnerabilities
```

```text
> Suggest performance optimizations for this function
```

### Work with your existing code

```text
> Implement a first draft for GitHub issue #123.
```

```text
> Help me migrate this codebase to the latest version of Java. Start with a plan.
```

### Automate your workflows

Use MCP servers to integrate your local system tools with your enterprise collaboration suite.

```text
> Make me a slide deck showing the git history from the last 7 days, grouped by feature and team member.
```

```text
> Make a full-screen web app for a wall display to show our most interacted-with GitHub issues.
```

### Interact with your system

```text
> Convert all the images in this directory to png, and rename them to use dates from the exif data.
```

```text
> Organise my PDF invoices by month of expenditure.
```

### Uninstall

Head over to the [Uninstall](docs/Uninstall.md) guide for uninstallation instructions.

## Terms of Service and Privacy Notice

For details on the terms of service and privacy notice applicable to your use of Gemini CLI, see the [Terms of Service and Privacy Notice](./docs/tos-privacy.md).

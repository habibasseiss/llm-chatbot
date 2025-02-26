# LLM-ChatBot

A multi-platform chatbot service built with TypeScript that handles incoming messages and chat sessions using AI capabilities.

## Features

- Multiple entry points:
  - WhatsApp message webhook handling
  - Command-line interface (CLI)
  - Easily extensible to other platforms
- AI-powered chat sessions using Ollama, OpenAI, or Groq
- PostgreSQL database integration for prompt management
- RESTful API endpoints
- Clean architecture implementation (Domain-Driven Design)

## Project Structure

```
src/
├── domain/           # Core business logic and entities
├── infrastructure/   # External services implementation
│   ├── adapters/     # Platform-specific adapters (WhatsApp, CLI)
│   ├── database/     # Database connections and configurations
│   ├── gateways/     # External service integrations (Ollama, OpenAI, Groq)
│   ├── repositories/ # Data access implementations
│   └── webserver/    # Express server setup
├── interfaces/       # Controllers and gateway interfaces
└── usecases/         # Application use cases
```

## Prerequisites

- Node.js >= 16.0.0
- PostgreSQL database
- AI service (Ollama, OpenAI, or Groq)
- WhatsApp Business API access (for WhatsApp integration)

## Environment Variables

```
# Required
DATABASE_URL=      # PostgreSQL connection URL
AI_SERVICE=        # AI service to use (openai, ollama, or groq)

# Optional - Platform selection
ENABLED_SOURCES=   # Comma-separated list of enabled platforms (whatsapp,cli)

# WhatsApp specific
GRAPH_API_TOKEN=   # WhatsApp Graph API token
WEBHOOK_VERIFY_TOKEN= # Token for webhook verification

# AI service specific
OLLAMA_HOST=       # Ollama AI service host (if using Ollama)
OPENAI_BASE_URL=   # OpenAI API base URL (if using OpenAI)
OPENAI_API_KEY=    # OpenAI API key (if using OpenAI)
GROQ_API_KEY=      # Groq API key (if using Groq)
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env` file
4. Run database migrations:
   ```bash
   npm run migrate
   ```

## Development

```bash
# Run in development mode
npm run dev

# Build the project
npm run build

# Start production server
npm start

# Run tests
npm test
```

## Using Different Entry Points

### WhatsApp

The WhatsApp integration uses webhooks to receive and send messages. You'll need to:
1. Set up a WhatsApp Business API account
2. Configure the webhook URL to point to your server's `/webhook` endpoint
3. Set the `GRAPH_API_TOKEN` and `WEBHOOK_VERIFY_TOKEN` environment variables

### CLI

The CLI interface allows you to interact with the chatbot directly from your terminal:
1. Make sure `cli` is included in the `ENABLED_SOURCES` environment variable (or leave it empty to enable all sources)
2. Run the application and interact through the command line
3. Type 'exit' to quit the CLI interface

### Adding New Platforms

To add a new platform:
1. Create a new adapter in `src/infrastructure/adapters/` that implements the `MessageSourceAdapter` interface
2. Create a controller for the new platform in `src/interfaces/controllers/`
3. Update the `main.ts` file to initialize the new adapter and controller
4. Add the new platform to the `MessageSource` enum in `src/domain/entities/GenericMessage.ts`

## Architecture

The project follows clean architecture principles with clear separation of concerns:

- **Domain Layer**: Contains business logic and entities
- **Use Cases**: Implements application-specific business rules
- **Infrastructure**: Handles external concerns (database, AI, HTTP)
- **Interfaces**: Defines boundaries between layers
- **Adapters**: Provides platform-specific implementations

## Technologies

- TypeScript
- Express.js
- AI Services (Ollama, OpenAI, Groq)
- PostgreSQL
- Jest (Testing)
- Node.js

## License

MIT License

## Author

Habib Asseiss Neto
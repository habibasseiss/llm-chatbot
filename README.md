# LLM-ChatBot

A WhatsApp chatbot service built with TypeScript that handles incoming messages and chat sessions using AI capabilities.

## Features

- WhatsApp message webhook handling
- AI-powered chat sessions using Ollama or OpenAI
- PostgreSQL database integration for prompt management
- RESTful API endpoints
- Clean architecture implementation (Domain-Driven Design)

## Project Structure

```
src/
├── domain/           # Core business logic and entities
├── infrastructure/   # External services implementation
│   ├── database/     # Database connections and configurations
│   ├── gateways/     # External service integrations (Ollama, HTTP)
│   ├── repositories/ # Data access implementations
│   └── webserver/    # Express server setup
├── interfaces/       # Controllers and gateway interfaces
└── usecases/         # Application use cases
```

## Prerequisites

- Node.js >= 16.0.0
- PostgreSQL database
- Ollama AI service
- WhatsApp Business API access

## Environment Variables

```
GRAPH_API_TOKEN=   # WhatsApp Graph API token
OLLAMA_HOST=       # Ollama AI service host
DATABASE_URL=      # PostgreSQL connection URL
OPENAI_BASE_URL=   # OpenAI API base URL
OPENAI_API_KEY=    # OpenAI API key
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

## Architecture

The project follows clean architecture principles with clear separation of concerns:

- **Domain Layer**: Contains business logic and entities
- **Use Cases**: Implements application-specific business rules
- **Infrastructure**: Handles external concerns (database, AI, HTTP)
- **Interfaces**: Defines boundaries between layers

## Technologies

- TypeScript
- Express.js
- Ollama AI
- PostgreSQL
- Jest (Testing)
- Node.js

## License

MIT License

## Author

Habib Asseiss Neto
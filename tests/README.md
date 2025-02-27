# Chatbot Tests

This directory contains tests for the chatbot application. The tests are organized by component type.

## Test Structure

- `adapters/`: Tests for message source adapters (CLI, WhatsApp)
- `controllers/`: Tests for API controllers (WebhookController)
- `gateway/`: Tests for gateway implementations (DatabaseSettingsGateway)
- `parsers/`: Tests for parsers (AIResponseParser)
- `repositories/`: Tests for repositories (DatabasePromptRepository, MockPromptRepository)
- `usecases/`: Tests for use cases (HandleGenericMessage, HandleIncomingMessage)

## Running Tests

```bash
# Run all tests
npm test

# Run specific test files
npm test -- tests/adapters

# Run a specific test file
npm test -- tests/adapters/CLIAdapter.test.ts
```

## Test Coverage

The tests cover:

1. **Message Source Adapters**:
   - `CLIAdapter`: Tests for message conversion, response handling, and CLI interaction
   - `WhatsAppAdapter`: Tests for webhook event handling, message conversion, and WhatsApp API interaction
   - `MessageSourceAdapter`: Tests for interface compliance and correct implementation

2. **Use Cases**:
   - `HandleGenericMessage`: Tests for processing messages from different sources, AI integration, and session management
   - `HandleIncomingMessage`: Tests for legacy WhatsApp message handling

3. **Controllers**:
   - `WebhookController`: Tests for webhook verification and message handling

4. **Repositories**:
   - `DatabasePromptRepository`: Tests for session management and prompt storage
   - `MockPromptRepository`: Implementation for testing

5. **Gateways**:
   - `DatabaseSettingsGateway`: Tests for retrieving application settings

6. **Parsers**:
   - `AIResponseParser`: Tests for parsing AI responses into structured format

## Mocking Strategy

The tests use Jest's mocking capabilities to:

1. Mock external dependencies (axios, readline)
2. Create mock implementations of interfaces
3. Spy on method calls to verify behavior
4. Mock console output for CLI testing

## Adding New Tests

When adding new message sources or features:

1. Create a test file in the appropriate directory
2. Follow the existing patterns for mocking dependencies
3. Test both the happy path and error scenarios
4. Ensure all interfaces are properly implemented

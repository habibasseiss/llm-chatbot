import { AIResponseParser } from "@/infrastructure/parsers/AIResponseParser";

describe("AIResponseParser", () => {
  describe("parse", () => {
    it("should parse a valid JSON response", () => {
      const response = JSON.stringify({
        bot: "Hello, how can I help?",
        options: ["Option 1", "Option 2"],
        closed: true,
      });

      const [text, isFinal, options] = AIResponseParser.parse(response);

      expect(text).toBe("Hello, how can I help?");
      expect(isFinal).toBe(true);
      expect(options.options).toEqual(["Option 1", "Option 2"]);
    });

    it("should parse a markdown-wrapped JSON response", () => {
      const response = `Some text before
\`\`\`json
{
  "bot": "Hello from markdown",
  "options": ["Option A", "Option B"],
  "closed": false
}
\`\`\`
Some text after`;

      const [text, isFinal, options] = AIResponseParser.parse(response);

      expect(text).toBe("Hello from markdown");
      expect(isFinal).toBe(false);
      expect(options.options).toEqual(["Option A", "Option B"]);
    });

    it("should handle JSON response without options", () => {
      const response = JSON.stringify({
        bot: "Simple response",
        closed: false,
      });

      const [text, isFinal, options] = AIResponseParser.parse(response);

      expect(text).toBe("Simple response");
      expect(isFinal).toBe(false);
      expect(options.options).toEqual([]);
    });

    it("should handle non-JSON response as plain text", () => {
      const response = "Just a plain text response";

      const [text, isFinal, options] = AIResponseParser.parse(response);

      expect(text).toBe("Just a plain text response");
      expect(isFinal).toBe(false);
      expect(options.options).toEqual([]);
    });

    it("should handle malformed JSON response as plain text", () => {
      const response = '{ "bot": "Incomplete JSON';

      const [text, isFinal, options] = AIResponseParser.parse(response);

      expect(text).toBe('{ "bot": "Incomplete JSON');
      expect(isFinal).toBe(false);
      expect(options.options).toEqual([]);
    });

    it("should handle empty response", () => {
      const response = "";

      const [text, isFinal, options] = AIResponseParser.parse(response);

      expect(text).toBe("");
      expect(isFinal).toBe(false);
      expect(options.options).toEqual([]);
    });
  });
});

import { OptionList } from "@/domain/entities/Message";

export class AIResponseParser {
  /// Returns multiple values: a string to reply to the user (where parsing for
  /// metadata like [options] will occur), a boolean that indicates if the
  /// response is the final response in the conversation (contains [closed] in
  /// the response), and an optional list of options for interactive messages.
  static parse(response: string): [string, boolean, OptionList] {
    let optionList: string[] = [];
    let isFinalResponse = false;

    const jsonContent = this.extractJsonContent(response);

    try {
      const [text, final, options] = this.parseJsonResponse(jsonContent);
      return [text, final, options];
    } catch (_) {
      // response is not a json string (parse error)
      console.log("No JSON response detected, using raw response.");
      return [response, isFinalResponse, { options: optionList }];
    }
  }

  private static extractJsonContent(response: string): string {
    const regex = /```json([\s\S]*?)```/;
    const match = response.match(regex);
    return match ? match[1].trim() : response;
  }

  private static parseJsonResponse(
    jsonContent: string
  ): [string, boolean, OptionList] {
    const responseObj = JSON.parse(jsonContent);
    const replyText = responseObj.bot;
    const optionList = responseObj.options || [];
    const isFinalResponse = responseObj.closed === true;

    return [replyText, isFinalResponse, { options: optionList }];
  }
}

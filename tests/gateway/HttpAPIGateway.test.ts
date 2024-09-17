import axios from "axios";
import { HttpAPIGateway } from "../../src/infrastructure/gateways/HttpAPIGateway";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("HttpAPIGateway", () => {
  let apiGateway: HttpAPIGateway;

  beforeEach(() => {
    console.error = jest.fn();
    apiGateway = new HttpAPIGateway("http://api.example.com", "secret-key");
  });

  it("should fetch system prompt from the external API", async () => {
    const mockResponse = {
      data: {
        system_prompt: "This is the system prompt",
        session_duration: 24,
      },
    };
    mockedAxios.get.mockResolvedValueOnce(mockResponse);

    const settings = await apiGateway.getSettings();
    expect(settings.system_prompt).toBe("This is the system prompt");
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "http://api.example.com/settings",
      { "headers": { "X-Api-Key": "secret-key" } },
    );
  });

  it("should throw an error if fetching the system prompt fails", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));

    await expect(apiGateway.getSettings()).rejects.toThrow(
      "Failed to fetch system prompt",
    );
  });
});

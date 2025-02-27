/**
 * Facebook Graph API constants
 */
export const FACEBOOK_GRAPH_API = {
  /**
   * Base URL for Facebook Graph API
   */
  BASE_URL: "https://graph.facebook.com",

  /**
   * Endpoints for the Facebook Graph API
   */
  ENDPOINTS: {
    /**
     * Messages endpoint - requires phone_number_id to be appended
     * @param phoneNumberId - The phone number ID to use in the endpoint
     * @param version - API version to use (defaults to V22)
     * @returns Full URL for the messages endpoint
     */
    MESSAGES: (phoneNumberId: string, version: string = "v22.0") =>
      `${FACEBOOK_GRAPH_API.BASE_URL}/${version}/${phoneNumberId}/messages`,
  },
};

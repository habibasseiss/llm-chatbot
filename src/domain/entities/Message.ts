// Top-level interface representing the entire JSON structure
export interface WhatsAppWebhookEvent {
  messaging_product: "whatsapp";
  metadata: Metadata;
  contacts: Contact[];
  messages: Message[];
}

// Metadata information about the phone number
export interface Metadata {
  display_phone_number: string;
  phone_number_id: string;
}

// Contact information
export interface Contact {
  profile: Profile;
  wa_id: string;
}

// Profile information within a contact
export interface Profile {
  name: string;
}

// Message structure
export interface Message {
  from: string;
  id: string;
  timestamp: string;
  text?: Text; // Optional, present if type is 'text'
  type: "text";
}

// Text content of a message
export interface Text {
  body: string;
}

// Custom data for Interactive Messages
// https://developers.facebook.com/docs/whatsapp/guides/interactive-messages/
export interface OptionList {
  options: string[];
}

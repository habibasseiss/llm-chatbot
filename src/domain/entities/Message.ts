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
  type: "text" | "interactive";
  interactive?: Interactive;
}

// Text content of a message
export interface Text {
  body: string;
}

export interface Interactive {
  type: string;
  button_reply: ButtonReply;
  list_reply: ListReply;
}

export interface ButtonReply {
  id: string;
  title: string;
}

export interface ListReply {
  id: string;
  title: string;
}

// Custom data for Interactive Messages
// https://developers.facebook.com/docs/whatsapp/guides/interactive-messages/
export interface OptionList {
  options: string[];
}

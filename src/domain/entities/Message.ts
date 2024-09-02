export interface Message {
  type: string;
  from: string;
  text: { body: string };
  id: string;
}

export interface Metadata {
  phone_number_id: string;
}

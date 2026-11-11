import api from "./api";

export interface Message {
  id: number;
  match_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  offered_price?: number | null;
  offered_quantity?: number | null;
  proposed_location?: string | null;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_role?: string;
}

export interface SendMessagePayload {
  content: string;
  offered_price?: number;
  offered_quantity?: number;
  proposed_location?: string;
}

export const messagesService = {
  /**
   * Fetch all messages for a specific match negotiation
   */
  async getMessages(matchId: number): Promise<Message[]> {
    const response = await api.get(`/messages/${matchId}`);
    return response.data;
  },

  /**
   * Send a new message or bargain offer (price, quantity, place)
   */
  async sendMessage(matchId: number, payload: SendMessagePayload): Promise<Message> {
    const response = await api.post(`/messages/${matchId}`, payload);
    return response.data;
  }
};

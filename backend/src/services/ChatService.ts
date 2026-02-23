import { ChatRepository } from "../repositories/ChatRepository";
export class ChatService {
  static async getMesssages(reportId: string) {
    const chatId = await ChatRepository.getChatIdFromReportId(reportId);
    if (!chatId) return [];

    const messages = await ChatRepository.getMessagesFromChatId(chatId.id);
    return messages;
  }

  static async startChat(reportId: string) {
    return ChatRepository.startChat(reportId);
  }

  static async getChatIdFromReportId(reportId: string) {
    return ChatRepository.getChatIdFromReportId(reportId);
  }

  static async hasUnread(userId: string, rtId?: string) {
    return ChatRepository.hasUnread(userId, rtId);
  }
}

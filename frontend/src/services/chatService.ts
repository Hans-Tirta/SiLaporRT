import { request } from "./api";

export async function getMessages(reportId: string) {
  const res = await request(`/chats/get/messages/${reportId}`, {
    method: "GET",
  });
  return res;
}

export async function startChat(reportId: string) {
  const res = await request(`/chats/start/chat/${reportId}`, {
    method: "POST",
  });
  return res;
}

export async function getChatId(reportId: string) {
  const res = await request(`/chats/get/chatId/${reportId}`, { method: "GET" });
  return res;
}

export async function hasUnread() {
  const res = await request(`/chats/get/chat/unread`, { method: "GET" });
  console.log({ res });
  return res;
}

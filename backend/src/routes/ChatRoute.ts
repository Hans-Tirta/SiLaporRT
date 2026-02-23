import { Router } from "express";
import { ChatController } from "../controllers/ChatController";
import { authenticateJWT } from "../middleware/AuthMiddleware";

const router = Router();

router.get("/get/messages/:reportId", authenticateJWT, ChatController.getMessages);
router.post("/start/chat/:reportId", authenticateJWT, ChatController.startChat);
router.get("/get/chatId/:reportId", authenticateJWT, ChatController.getChatId);
router.get("/get/chat/unread", authenticateJWT, ChatController.hasUnread);

export default router;
import { Request, Response } from "express";
import { ChatService } from "../services/ChatService";

export class ChatController {
  static async getMessages(req: Request, res: Response) {
    const { reportId } = req.params;
    try {
      const result = await ChatService.getMesssages(reportId);
      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No messages found",
        });
      }

      res.status(201).json({
        success: true,
        message: "Message Fetched Successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error in createReport controller:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async startChat(req: Request, res: Response) {
    const { reportId } = req.params;
    try {
      const result = await ChatService.startChat(reportId);
      res.status(201).json({
        success: true,
        message: "Chat started successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error in createReport controller:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getChatId(req: Request, res: Response) {
    const { reportId } = req.params;
    try {
      const result = await ChatService.getChatIdFromReportId(reportId);
      res.status(201).json({
        success: true,
        message: "Chat Fetched Successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error in createReport controller:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async hasUnread(req: Request, res: Response) {
    const user = req.user as { id: string; rtId?: string };

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    try {
      const result = await ChatService.hasUnread(user.id, user.rtId);
      console.log({ result });
      if (result === false) {
        return res.status(201).json({
          success: true,
          message: "No unread messages",
          data: result,
        });
      }
      console.log("result", result);
      res.status(201).json({
        success: true,
        message: "There is an unread message",
        data: result,
      });
    } catch (error: any) {
      console.error("Error in createReport controller:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

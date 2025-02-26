import { prismaClient } from "../lib/db.js";
import { pubsub } from "../app.js"; // Import shared pubsub instance

class chatService {
  static async getMessages(payload) {
    const { User, chatWith } = payload;
    if (!User || !User.id) {
      throw new Error("User is not authenticated.");
    }
    // console.log("User:", User);
    // console.log("Chat With:", chatWith);

    return prismaClient.message.findMany({
      where: {
        OR: [
          { senderId: User.id, receiverId: chatWith },
          { senderId: chatWith, receiverId: User.id },
        ],
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        content: true,
        createdAt: true,
        senderId: true,
        receiverId: true,
        read: true, // Include read field
      },
    });
  }

  static async sendMessage(payload) {
    const { User, receiverId, content } = payload;
  
    // Create the message
    const message = await prismaClient.message.create({
      data: { senderId: User.id, receiverId, content, read: false }, // Default to unread
    });
    
    // Get additional details for the sender
    const sender = await prismaClient.user.findUnique({
      where: { id: User.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        picture: true,
      },
    });
  
    // Fetch unread count for the receiver
    const unreadCount = await prismaClient.message.count({
      where: {
        receiverId,
        senderId: User.id,
        read: false,
      },
    });
  
    const enrichedPayload = {
      messageReceived: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        receiverId: message.receiverId,
        sender: {
          id: sender.id,
          username: sender.email.split("@")[0],
          firstName: sender.firstName,
          lastName: sender.lastName,
          picture: sender.picture,
        },
        unreadCount,
        eventType: "NEW_MESSAGE",
        read:message.read
      },
    };
    
    pubsub.publish(`MESSAGE_RECEIVED_${receiverId}`, enrichedPayload);
    pubsub.publish(`MESSAGE_RECEIVED_${User.id}`, 
      enrichedPayload
   
    );
    // console.log("Message published:", enrichedPayload);
    return message;
  }
  
  
  static async getUserChats(payload) {
    const { User } = payload;
  
    if (!User || !User.id) {
      throw new Error("User is not authenticated.");
    }
  
    const chats = await prismaClient.message.groupBy({
      by: ["senderId", "receiverId"],
      where: {
        OR: [{ senderId: User.id }, { receiverId: User.id }],
      },
    });
  
    // Remove duplicates
    const uniqueChats = chats.filter(
      (chat, index, self) =>
        index ===
        self.findIndex(
          (c) =>
            (c.senderId === chat.senderId && c.receiverId === chat.receiverId) ||
            (c.senderId === chat.receiverId && c.receiverId === chat.senderId)
        )
    );
  
    const chatUsers = await Promise.all(
      uniqueChats.map(async (chat) => {
        const otherUserId =
          chat.senderId === User.id ? chat.receiverId : chat.senderId;
  
        const otherUser = await prismaClient.user.findUnique({
          where: { id: otherUserId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            picture: true,
            isActive: true, // Fetch active status
            lastActive: true, // Fetch last active time
          },
        });
  
        const lastMessage = await prismaClient.message.findFirst({
          where: {
            OR: [
              { senderId: User.id, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: User.id },
            ],
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            read: true, // Include read field
          },
        });
  
        const unreadCount = await prismaClient.message.count({
          where: {
            senderId: otherUserId,
            receiverId: User.id,
            read: false,
          },
        });
  
        return {
          id: otherUser.id,
          username: otherUser.email.split("@")[0],
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          picture: otherUser.picture,
          isActive: otherUser.isActive, // Include active status
          lastActive: otherUser.lastActive, // Include last active timestamp
          lastMessage: lastMessage?.content || "",
          lastMessageTime: lastMessage?.createdAt || null,
          unreadCount,
          read: lastMessage?.read || false, // Include read status
        };
      })
    );
  
    return chatUsers;
  }
  
  
  static async markMessagesAsRead(payload) {
    const { User, chatWith } = payload;
    if (!User || !User.id) {
      throw new Error("User is not authenticated.");
    }
  
    // Mark messages as read
    await prismaClient.message.updateMany({
      where: {
        receiverId: User.id,
        senderId: chatWith,
        read: false,
      },
      data: {
        read: true,
      },
    });
  
    // Fetch the updated unread count for the sender
    const unreadCount = await prismaClient.message.count({
      where: {
        receiverId: User.id,
        senderId: chatWith,
        read: false,
      },
    });
  
    // Notification payload
    const notificationPayload = {
      messageReceived: {
        receiverId: User.id,
        chatWith,
        unreadCount,
        read: true, // Explicitly mark as read in the notification
        eventType: "READ_NOTIFICATION",
      },
    };
  
    // Notify the receiver
    pubsub.publish(`MESSAGE_RECEIVED_${User.id}`, notificationPayload);
  
    // Notify the sender
    pubsub.publish(`MESSAGE_RECEIVED_${chatWith}`, notificationPayload);
  
    // console.log("Marked messages as read and notified subscription:", notificationPayload);
  }
  
}
export default chatService;

import postService from "../../services/post.js";
import UserService from "../../services/user.js";
import chatService from "../../services/chat.js"; // Import chatService

const queries = {
  async getNotifications(_, __, context) {
    return await UserService.getNotifications(context.User.id);

  },

  async getUserChats(_, __, { User }) {
    return await chatService.getUserChats({ User });
  },
  async findUserById(_, { userId }) {
    return await UserService.findUserById(userId);
  },
  getMessages: async (_, { chatWith }, { User }) => {
    if (User.id) {

      try {
        // Fetch messages between two users
        const messages = await chatService.getMessages({ User, chatWith });
        return messages;
      } catch (error) {
        console.error("Error fetching messages:", error);
        throw new Error("Error fetching messages.");
      }
    }
    else {
      throw new Error("User is not authenticated.");
    }
  },

  getUserToken: async (_, { email, password }) => {
    try {
      const token = await UserService.getUserToken({ email, password });
      return token;
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }

  },

  getCurrentLoggedInUser: async (_, _2, context) => {
    if (context.User) {
      try {
        const user = await UserService.getUserByEmail(context.User.email);
        return user;
      } catch (error) {
        console.error("Error fetching user:", error);
        throw new Error("Error fetching user details.");
      }
    } else {
      throw new Error("User is not authenticated.");
    }
  },

  getAllPost: async (_1, { offset, limit }) => {
    try {
      const res = await postService.getallPost({ offset, limit });
      return res;
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw new Error("Error fetching posts.");
    }
  },

  getAllUserPost: async (_, _2, context) => {
    try {
      const res = await postService.getUserAllPost(context.User.id);
      return res;
    } catch (error) {
      console.error("Error :", error);
      throw new Error(error);
    }
  },

  findUserProfile: async (_, { id }, context) => {
    try {
      const res = await UserService.findUserProfile({ id, context });
      return res;
    } catch (error) {
      console.error("Error :", error);
      throw new Error(error);
    }
  },

  findByName: async (_, { firstName, offset, limit }, context) => {
    try {
      const res = await UserService.findByName({ firstName, context, offset, limit });
      return res;
    } catch (error) {
      console.error("Error :", error);
      throw new Error(error);
    }
  },

  getUserFollowers: async (_, { userId, offset, limit }, context) => {
    return await UserService.getUserFollowers({ userId, context, offset, limit });
  },

  getUserFollowing: async (_, { userId, offset, limit }, context) => {
    return await UserService.getUserFollowing({ userId, context, offset, limit });
  },
};

const mutations = {
  updateProfile: async (_, { firstName, lastName }, context) => {
    try {
      const res = await UserService.updateProfile({ firstName, lastName, context });
      return res;
    } catch (error) {
      console.error("Can't Update profile :", error);
    }
  },

  createUser: async (_, { firstName, lastName, email, password }) => {
    try {
      const res = await UserService.createUser({ firstName, lastName, email, password });
      return res;
    } catch (error) {
      console.error("Error creating user:", error);
      if (error.code === 'P2002') {
        throw new Error('A user with this email already exists.');
      }
      throw new Error('Failed to create user.');
    }
  },

  createPost: async (_, { title, content }, context) => {
    if (!context.User || !context.User.id) {
      throw new Error("User is not authenticated.");
    }

    try {
      const res = await postService.createPost({ title, content, context });
      return res;
    } catch (error) {
      console.error("Error creating post:", error);
      throw new Error(error);
    }
  },

  updatePost: async (_, { postId, title, content }, context) => {
    if (!context.User || !context.User.id) {
      throw new Error("User is not authenticated.");
    }

    try {
      const res = await postService.updatePost({ postId, title, content, context });
      return res;
    } catch (error) {
      console.error("Error updating post:", error);
      throw new Error(error);
    }
  },

  deletePost: async (_, { postId }, context) => {
    if (!context.User || !context.User.id) {
      throw new Error("User is not authenticated.");
    }

    try {
      const res = await postService.deletePost({ postId, context });
      return res;
    } catch (error) {
      console.error("Error deleting post:", error);
      throw new Error(error);
    }
  },

  likePost: async (_, { postId }, context) => {
    return await postService.likePost({ postId, context });
  },

  followUser: async (_, { targetUserId }, context) => {
    return await postService.followUser({ targetUserId, context });
  },

  sendMessage: async (_, { receiverId, content }, { User }) => {
    if (User.id) {
      try {

        const message = await chatService.sendMessage({ User, receiverId, content });
        return message;
      }
      catch (error) {
        console.error("Error sending message:", error);
        throw new Error("Error sending message.");
      }
    }
    else {
      throw new Error("User is not authenticated.");
    }
  },
  markMessagesAsRead: async (_, { chatWith }, { User }) => {
    if (!User || !User.id) {
      throw new Error("User is not authenticated.");
    }

    // Call the chatService to update messages as read
    await chatService.markMessagesAsRead({ User, chatWith });
    return true; // Return true to indicate success
  },
  markNotificationAsRead: async (_, __, { User }) => {
    if (!User || !User.id) {
      throw new Error("User is not authenticated.");
    }
    return await postService.markNotificationAsRead({ User })
  }
};

// In your subscription resolver


const subscription = {
  messageReceived: {
    subscribe: async (_, __, { User, pubsub }) => {
      if (!User.id) {
        throw new Error("User is not authenticated.");
      }
      // console.log(`Subscribing to topic: MESSAGE_RECEIVED_${User.id}`);
      return pubsub.asyncIterator(`MESSAGE_RECEIVED_${User.id}`);
    },
  },
  activeStatusUpdated: {
    subscribe: (_, __, { pubsub }) => {
      // console.log("Subscribing to topic: ACTIVE_STATUS_UPDATED");
      return pubsub.asyncIterator("ACTIVE_STATUS_UPDATED");
    },
  },
  likedNotification: {
    subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(["POST_LIKED_UPDATE"]),
    resolve: (payload) => {
      // console.log("Resolving payload:", payload);

      // Extract and transform the payload
      const notification = payload.postLikedUpdate;
      if (!notification) {
        return [];
      }

      // Wrap the single notification in an array
      return [notification];
    },
  },
  followNotification: {
    subscribe: (_, { userId }, { pubsub }) => pubsub.asyncIterator([`FOLLOW_UPDATE_${userId}`]),
    resolve: (payload) => {
      // console.log("Resolving payload:", payload);
      const notification = payload.followUpdate;
      if (!notification) {
        return [];
      }
      return [notification];
    },
  },
  notificationMarkedRead: {
    subscribe: (_, __, { User,pubsub }) => {
      // console.log(`NOTIFICATION_MARK_READ_${User.id}`);
      return pubsub.asyncIterator(`NOTIFICATION_MARK_READ_${User.id}`);
    },
  },
};


export const resolvers = { queries, mutations, subscription };

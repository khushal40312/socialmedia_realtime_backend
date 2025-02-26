import { pubsub } from "../app.js";
import { prismaClient } from "../lib/db.js";
import UserService from "./user.js";


class postService {

    static async createPost(payload) {
        const { title, content, context } = payload;
        if (!context.User || !context.User.id) {
            throw new Error("User is not authenticated.");
        } else if (title === "" || content === "") {
            throw new Error("Title and Content field cannot be empty")

        }

        return await prismaClient.post.create({
            data: {
                title,
                content,
                authorId: context.User.id
            }
        });


    }
    static async getallPost(payload) {
        const { offset, limit } = payload;

        try {
            const posts = await prismaClient.post.findMany({
                skip: offset,            // Skip posts based on offset
                take: limit,             // Limit the number of posts
                include: {
                    author: {            // Include author details
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            picture: true,
                            email: true
                        },
                    },
                    likedBy: {           // Include users who liked this post
                        select: {
                            createdAt: true,
                            user: {         // Fetch user information from the relation
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    picture: true,

                                },
                            },
                        },
                    },
                },
            });

            // Transform the posts to format likedBy with user info and createdAt
            const transformedPosts = posts.map(post => ({
                ...post,
                likedBy: post.likedBy.map(like => ({
                    id: like.user.id,
                    firstName: like.user.firstName,
                    lastName: like.user.lastName,
                    createdAt: like.createdAt,
                    picture: like.user.picture,

                })),
            }));

            return transformedPosts;
        } catch (error) {
            console.error("Error fetching posts:", error);
            throw new Error("Error fetching posts.");
        }
    }


    static async getUserAllPost(authorId) {
        try {
            const posts = await prismaClient.post.findMany({
                where: { authorId },
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            picture: true,
                        },
                    },
                    likedBy: {
                        select: {
                            createdAt: true,
                            user: { // Fetch user information from the relation
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    picture: true
                                },
                            },
                            post: { // Include post information in likedBy
                                select: {
                                    id: true,
                                    title: true,
                                    content: true,
                                    createdAt: true,
                                    updatedAt: true,

                                },
                            },
                        },
                    },
                },
            });

            // Transform the posts to include detailed likedBy info
            const transformedPosts = posts.map(post => ({
                ...post,
                likedBy: post.likedBy.map(like => ({
                    id: like.user.id,
                    firstName: like.user.firstName,
                    lastName: like.user.lastName,
                    createdAt: like.createdAt,
                    picture: like.user.picture,
                    post: like.post, // Include post information for each like
                })),
            }));

            return transformedPosts;
        } catch (error) {
            console.error("Error fetching user's posts:", error);
            throw new Error("Error fetching posts.");
        }
    }


    static async updatePost(payload) {
        const { postId, title, content, context } = payload;

        // Validate user authentication and input
        if (!context.User || !context.User.id) {
            throw new Error("User is not authenticated.");
        } else if (!title || !content) {
            throw new Error("Title and Content fields cannot be empty.");
        }

        try {
            // Update the post using Prisma
            const updatedPost = await prismaClient.post.updateMany({
                where: {
                    AND: [
                        { authorId: context.User.id },
                        { id: postId }
                    ]
                },
                data: {
                    title,
                    content
                }
            });

            if (updatedPost.count === 0) {
                throw new Error("No post found for the specified user.");
            }

            return "Post updated successfully."
        } catch (error) {
            return error.message
        }
    }
    static async deletePost(payload) {
        const { postId, context } = payload;

        // Check user authentication
        if (!context.User || !context.User.id) {
            throw new Error("User is not authenticated.");
        }

        try {
            // Delete the post based on the postId and authorId
            const deletedPost = await prismaClient.post.deleteMany({
                where: {
                    AND: [
                        { authorId: context.User.id },
                        { id: postId }
                    ]
                }
            });

            if (deletedPost.count === 0) {
                throw new Error("No post found for the specified user and post ID.");
            }

            return "Post deleted successfully.";
        } catch (error) {
            return error.message;
        }
    }
    static async likePost(payload) {
        const { postId, context } = payload;

        if (!context.User || !context.User.id) {
            throw new Error("User is not authenticated.");
        }
        const generateRandomId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

        try {
            const userId = context.User.id;

            // Check if the user already liked the post
            const existingLike = await prismaClient.postLike.findUnique({
                where: { postId_userId: { postId, userId } },
            });

            // Fetch user details
            const user = await UserService.findUserById(userId);

            if (!user) {
                throw new Error("User not found.");
            }

            const { firstName, lastName, picture } = user;

            let message;
            if (existingLike) {
                // Unlike the post
                await prismaClient.$transaction([
                    prismaClient.post.update({
                        where: { id: postId },
                        data: { likes: { decrement: 1 } },
                    }),
                    prismaClient.postLike.delete({
                        where: { id: existingLike.id },
                    }),
                    prismaClient.notification.deleteMany({
                        where: {
                            type: "LIKE",
                            postId,
                            senderId: userId,
                        },
                    }),
                ]);
                // Trigger subscription for unlike event
                message = "Post unliked successfully.";
                pubsub.publish("POST_LIKED_UPDATE", {
                    postLikedUpdate: {
                        id: generateRandomId(),
                        postId,
                        senderId: userId,
                        firstName,
                        lastName,
                        postTitle: null, // No need for title in unlike notification
                        status: "UNLIKED",
                        read: true,
                        message,
                        picture,
                        type: "LIKE",

                    },
                });

            } else {
                // Like the post and fetch post details
                const post = await prismaClient.post.findUnique({
                    where: { id: postId },
                    select: { title: true, authorId: true },
                });

                if (!post) {
                    throw new Error("Post not found.");
                }

                const [_, __, createdNotification] = await prismaClient.$transaction([
                    prismaClient.post.update({
                        where: { id: postId },
                        data: { likes: { increment: 1 } },
                    }),
                    prismaClient.postLike.create({
                        data: { postId, userId },
                    }),
                    prismaClient.notification.create({
                        data: {
                            type: "LIKE",
                            read: false,
                            userId: post.authorId, // Post author
                            senderId: userId,
                            postId,
                            postTitle: post.title,
                            firstName,
                            lastName,
                            picture,
                        },
                    }),
                ]);
                // console.log(createdNotification)

                // Trigger subscription for like event
                message = "Post liked successfully.";
                pubsub.publish("POST_LIKED_UPDATE", {
                    postLikedUpdate: {
                        id: createdNotification.id,
                        postId,
                        senderId: userId,
                        firstName,
                        lastName,
                        postTitle: post.title, // Include the post title in the notification
                        status: "LIKED",
                        read: false,
                        message,
                        picture,
                        createdAt: new Date(),
                        type: "LIKE",

                    },
                });

            }

            return message;
        } catch (error) {
            console.error("Error liking/unliking post:", error);
            throw new Error("Error liking/unliking post.");
        }
    }


    static async followUser(payload) {
        const { targetUserId, context } = payload;

        // Validate user authentication
        if (!context.User || !context.User.id) {
            throw new Error("User is not authenticated.");
        }

        const userId = context.User.id;

        if (userId === targetUserId) {
            throw new Error("You cannot follow/unfollow yourself.");
        }
        const generateRandomId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);
        const user = await UserService.findUserById(userId);
        const { firstName, lastName, picture } = user;

        try {
            // Check if the user already follows the target user
            const existingFollow = await prismaClient.follower.findUnique({
                where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
            });

            let message;
            if (existingFollow) {
                // Unfollow logic
                const [_, __, ___, createdNotification] = await prismaClient.$transaction([
                    prismaClient.user.update({
                        where: { id: userId },
                        data: { following: { decrement: 1 } },
                    }),
                    prismaClient.user.update({
                        where: { id: targetUserId },
                        data: { followers: { decrement: 1 } },
                    }),
                    prismaClient.follower.delete({
                        where: { id: existingFollow.id },
                    }),
                    prismaClient.notification.deleteMany({
                        where: {
                            type: "FOLLOW",
                            userId: targetUserId,
                            senderId: userId,
                        },
                    }),
                ]);
                message = "Unfollowed";

                pubsub.publish(`FOLLOW_UPDATE_${targetUserId}`, {
                    followUpdate: {
                        id: generateRandomId(),
                        postId: null,
                        senderId: userId,
                        firstName,
                        lastName,
                        postTitle: "BLANKFOLLOWER", // No need for title in unlike notification
                        status: "UNFOLLOW",
                        read: true,
                        message,
                        picture,
                        type: "FOLLOW",

                    },
                });
            } else {
                // Follow logic
                const [_, __, ___, createdNotification] = await prismaClient.$transaction([
                    prismaClient.user.update({
                        where: { id: userId },
                        data: { following: { increment: 1 } },
                    }),
                    prismaClient.user.update({
                        where: { id: targetUserId },
                        data: { followers: { increment: 1 } },
                    }),
                    prismaClient.follower.create({
                        data: { followerId: userId, followingId: targetUserId },
                    }),
                    prismaClient.notification.create({
                        data: {
                            type: "FOLLOW",
                            read: false,
                            userId: targetUserId, // Post author
                            senderId: userId,
                            postId: null,
                            postTitle: "BLANKFOLLOWER",
                            firstName,
                            lastName,
                            picture,
                        },
                    }),
                ]);
                message = "Followed";
                pubsub.publish(`FOLLOW_UPDATE_${targetUserId}`, {
                    followUpdate: {
                        id: createdNotification.id,
                        postId: createdNotification.postId,
                        senderId: createdNotification.senderId,
                        firstName: createdNotification.firstName,
                        lastName: createdNotification.lastName,
                        postTitle: "BLANKFOLLOWER", // No need for title in unlike notification
                        status: "FOLLOW",
                        read: false,
                        message,
                        picture: createdNotification.picture,
                        createdAt: new Date(),
                        type: "FOLLOW",

                    },
                });
            }

            return message;
        } catch (error) {
            console.error("Error following/unfollowing user:", error);
            throw new Error("Error following/unfollowing user.");
        }
    }
    static async markNotificationAsRead(payload) {
        const { User } = payload;
        try {
            await prismaClient.notification.updateMany({
                where: {
                    userId: User.id,
                    read: false,
                },
                data: {
                    read: true,
                },
            });

            const notificationPayload = {
                notificationMarkedRead: {
                    userId: User.id,
                    read: true,
                }
            };

            // Publish to the correct topic
            pubsub.publish(`NOTIFICATION_MARK_READ_${User.id}`, notificationPayload);

            return "marked as read"
        } catch (error) {
            console.error("Error marking notification as read:", error);
            throw new Error("Error marking notification as read.");
        }
    }

}
export default postService;

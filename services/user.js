
import JWT from "jsonwebtoken";
import { prismaClient } from "../lib/db.js";
import { createHmac, randomBytes } from 'node:crypto';
import { pubsub } from "../app.js"; // Import shared pubsub instance

class UserService {
    static async setActiveStatus(userId, isActive) {
        if (isActive) {
            // Mark user as active immediately
            await prismaClient.user.update({
                where: { id: userId },
                data: {
                    isActive: true,
                    lastActive: new Date(),
                },
            });

            pubsub.publish("ACTIVE_STATUS_UPDATED", {
                activeStatusUpdated: {
                    userId,
                    isActive: true,
                    lastActive: new Date(),
                },
            });
        }
        else {
            // console.log(`Delaying offline status for user ${userId}`);
            setTimeout(async () => {
                // console.log(`Checking offline status for user ${userId}`);
                const user = await prismaClient.user.findUnique({ where: { id: userId } });
                // console.log(user.isActive)
                if (user && !isActive) {
                    try {
                        await prismaClient.user.update({
                            where: { id: userId },
                            data: {
                                isActive: false,
                                lastActive: new Date(),
                            },
                        });
                        // console.log(`Database updated: User ${userId} marked offline`);
                    } catch (error) {
                        console.error(`Error updating user ${userId} to offline:`, error);
                    }


                    pubsub.publish("ACTIVE_STATUS_UPDATED", {
                        activeStatusUpdated: {
                            userId,
                            isActive: false,
                            lastActive: new Date(),
                        },
                    });
                }
            }, 5000); // 5-second delay
        }

    }
    // Static method to create a user
    static async genrateHash(salt, password) {


        // Hash the password with the salt
        const hashedPassword = createHmac('sha256', salt)
            .update(password)
            .digest('hex');

        return hashedPassword.toString()
    }



    static async createUser(payload) {
        const { firstName, lastName, email, password } = payload;

        // Generate a random salt
        const salt = randomBytes(32).toString('hex');

        // Hash the password with the salt
        const hashedPassword = await UserService.genrateHash(salt, password);
        const defaultPicture = "https://res.cloudinary.com/dodnxrlj6/image/upload/v1740730369/default_jc14qo.jpg";

        // Store the user in the database
        const user = await prismaClient.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                salt,
                picture: defaultPicture,

            }
        });
        //JWT Logic
        const token = JWT.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET_KEY);
        return token
    }

    static getUserByEmail(email) {
        if (!email) {
            throw new Error("I DON'T KNOW WHO ARE YOU")
        }
        return prismaClient.user.findUnique({ where: { email } })



    }
    static findUserById(userId) {
        if (!userId) {
            throw new Error("I DON'T KNOW WHO ARE YOU")
        }
        return prismaClient.user.findUnique({ where: { id:userId } })

    }
    static async getUserToken(payload) {
        const { email, password } = payload;

        const user = await UserService.getUserByEmail(email)
        if (!user) throw new Error('user not found')

        const userSalt = user.salt
        const userHashPassword = (await UserService.genrateHash(userSalt, password)).toString()
        if (userHashPassword !== user.password) throw new Error("INCORRECT PASSWORD")


        //JWT Logic
        const token = JWT.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET_KEY);
        return token
    }
    static async decodeToken(payload) {

        return JWT.verify(payload, process.env.JWT_SECRET_KEY);

    }
    static async updateProfile(payload) {
        const { firstName, lastName, context } = payload;

        const user = await UserService.getUserByEmail(context.User.email);
        if (!user) throw new Error('User not found');

        try {
            const updatedUser = await prismaClient.user.update({
                where: { email: context.User.email },
                data: {
                    firstName,
                    lastName,
                },
            });



            if (!updatedUser) {
                throw new Error("Not allowed");
            }

            return updatedUser;
        } catch (error) {
            console.error("Error updating user:", error);
            return error.message;
        }
    }
    static async findUserProfile(payload) {
        const { id, context } = payload;

        // Check if the user is authenticated
        if (!context?.User?.id) {
            throw new Error("User is not authenticated.");
        }

        try {
            // Fetch the user profile by email
            const user = await prismaClient.user.findUnique({
                where: { id },
                include: {
                    posts: {
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
                                    user: {
                                        select: {
                                            id: true,
                                            firstName: true,
                                            lastName: true,
                                            picture: true,
                                        },
                                    },
                                    post: {
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
                    },
                    likedPosts: true, // Include likedPosts if needed
                },
            });

            if (!user) {
                throw new Error("User not found.");
            }

            // Transform posts to include detailed `likedBy` information
            const transformedPosts = user.posts.map(post => ({
                ...post,
                likedBy: post.likedBy.map(like => ({
                    id: like.user.id,
                    firstName: like.user.firstName,
                    lastName: like.user.lastName,
                    picture: like.user.picture,
                    createdAt: like.createdAt,
                    post: like.post, // Include post details for the like
                })),
            }));

            // Return the user profile with transformed posts
            return {
                ...user,
                posts: transformedPosts,
            };
        } catch (error) {
            console.error("Error in findUserProfile:", error);
            throw new Error("An error occurred while fetching the user profile.");
        }
    }
    static async findByName(payload) {
        const { firstName, offset, limit, context } = payload;

        // Check if the user is authenticated
        if (!context?.User?.id) {
            throw new Error("User is not authenticated.");
        }

        try {
            // Find users whose first name starts with the provided string
            const users = await prismaClient.user.findMany({
                where: {
                    firstName: {
                        contains: firstName, // Matches users whose first name contains the given substring
                        mode: 'insensitive',
                    },
                },


                skip: offset, // Offset for pagination
                take: limit, // Limit for pagination
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    picture: true,
                    email: true,
                    followers: true
                },
            });
            // console.log(users)
            return users;
        } catch (error) {
            console.error("Error in findByName:", error);
            throw new Error("An error occurred while searching for users.");
        }
    }
    static async getUserFollowers(payload) {
        const { userId, offset, limit, context } = payload;

        // Check if the user is authenticated
        if (!context?.User?.id) {
            throw new Error("User is not authenticated.");
        }

        try {
            // Fetch the followers of the user
            const followers = await prismaClient.follower.findMany({
                where: {
                    followingId: userId, // Users following this user
                },
                skip: offset, // Offset for pagination
                take: limit, // Limit for pagination
                include: {
                    follower: { // Include details of the follower user
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            picture: true,
                            email: true,
                            followers: true, // Include followers count if defined
                        },
                    },
                },
            });

            // Transform the results to ensure followers count is always 0 if null
            return followers.map(f => ({
                ...f.follower,
                followers: f.follower.followers || 0, // Default to 0 if null
            }));
        } catch (error) {
            console.error("Error in getUserFollowers:", error);
            throw new Error("An error occurred while fetching followers.");
        }
    }


    static async getUserFollowing(payload) {
        const { userId, offset, limit, context } = payload;

        // Check if the user is authenticated
        if (!context?.User?.id) {
            throw new Error("User is not authenticated.");
        }

        try {
            // Fetch the users that the user is following
            const following = await prismaClient.follower.findMany({
                where: {
                    followerId: userId, // Users this user is following
                },
                skip: offset, // Offset for pagination
                take: limit, // Limit for pagination
                include: {
                    following: { // Include details of the followed user
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            picture: true,
                            email: true,
                            followers: true
                        },
                    },
                },
            });

            // Transform the results to include only following details
            return following.map(f => ({
                ...f.following,
                followers: f.following.followers || 0,

            }))
        } catch (error) {
            console.error("Error in getUserFollowing:", error);
            throw new Error("An error occurred while fetching the following list.");
        }
    } 
    
    static async getNotifications(userId) {
        
        if (!userId) {
            throw new Error("User is not authenticated.");
        }
    
        try {
            const noti= await prismaClient.notification.findMany({
                where: { userId },
                orderBy: { createdAt: "asc" },
            });
            return noti;
        } catch (error) {
            console.error("Error fetching notifications:", error);
            throw new Error("Error fetching notifications.");
        }
    }
    


}

export default UserService;

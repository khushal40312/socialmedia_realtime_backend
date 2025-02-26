export const typeDefs = `
type User {
  id: ID!
  firstName: String!
  lastName: String
  picture: String  
  email: String!
  followers: Int           # Count of followers
  following: Int           # Count of users this user is following
  followersList: [User!]!  # List of users following this user
  followingList: [User!]!  # List of users this user is following
  posts: [Post!]!          # Posts authored by the user
  likedPosts: [Post!]!     # Posts liked by the user
      isActive: Boolean!         # Indicates if the user is currently active
  lastActive: String         # Timestamp of the user's last active time
}

type LikedBy {
  id: ID!
  firstName: String!
  lastName: String
  picture: String!
  createdAt: String!  # The timestamp when the user liked the post
  post: Post!         # The associated post information
}

type Post {
  id: ID
  title: String!
  content: String!
  createdAt: String!
  updatedAt: String!
  authorId: String!
  likes: Int
  author: User
  likedBy: [LikedBy!]!  # Updated to include LikedBy with user info and createdAt
  
}

type Message {
  id: ID!
  senderId: ID!
  receiverId: ID!
  content: String!
   createdAt: String!
  read: Boolean! # New field
}

type Chat {
  id: ID!                
  username: String!      
  firstName: String!     
  lastName: String       
  picture: String        
  lastMessage: String!   
  lastMessageTime: String!
  unreadCount: Int!   
  read:Boolean!  
   isActive: Boolean!         # Indicates if the user is currently active
  lastActive: String         # Timestamp of the user's last active time
}
type MessageReceived {
  id: ID
  receiverId: ID!
  content: String
  createdAt: String
  sender: Sender  # Include sender details
    unreadCount: Int
  eventType: String!           # "NEW_MESSAGE" or "READ_NOTIFICATION"
  chatWith: ID    
  read: Boolean! 


}


type Sender {
  id: ID!
  username: String!
  firstName: String!
  lastName: String
  picture: String
}

type activeStatusUpdated{
userId:String!
  isActive: Boolean!         # Indicates if the user is currently active
  lastActive: String         # Timestamp of the user's last active time

}
type LikedNotification{
id: String!
 postId:String
  senderId:String
  firstName: String
  lastName:String
  postTitle: String
  status: String
  read: Boolean
  message: String
  picture: String
  createdAt:String
    type: String


}
  type getUserNotification{
    id: String!
    type: String!
    userId:String!
    postId: String
    senderId: String!
    postTitle: String!
    read: Boolean!
    createdAt: String!
    firstName: String!
    lastName: String!
  picture:String
  

  }
  type notificationMarkedRead{
    userId:String!
  read: Boolean!
  
  }
  
`;
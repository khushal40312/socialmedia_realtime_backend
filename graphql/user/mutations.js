export const mutations = `
  
    createUser(firstName: String!, lastName: String!, email: String!, password: String!): String
    createPost(title:String!,content:String!):Post
    updatePost(postId:String!,title:String!,content:String!):String!
    deletePost(postId:String!):String!
    likePost(postId: String!): String! 
    updateProfile(firstName:String!,lastName: String!):User!
followUser(targetUserId:String!):String!
 sendMessage( receiverId: ID!, content: String!): Message!
 markMessagesAsRead(chatWith: ID!): Boolean
 markNotificationAsRead:String!
`;

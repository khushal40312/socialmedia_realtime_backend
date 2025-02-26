export const queries = `
getUserToken(email:String!,password:String!):String!
getCurrentLoggedInUser:User
getAllPost(offset: Int, limit: Int):[Post]
getAllUserPost:[Post]
findUserProfile(id:String!):User
findByName(firstName:String!,offset: Int, limit: Int):[User]
getUserFollowers(userId: String!,offset: Int, limit: Int): [User!]!
getUserFollowing(userId: String!,offset: Int, limit: Int): [User!]! 
 getMessages( chatWith: ID!): [Message!]!
getUserChats: [Chat!]!
findUserById(userId:String!):User!
getNotifications:[getUserNotification]
`
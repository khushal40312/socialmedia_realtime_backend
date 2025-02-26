export const subscription = `
 messageReceived: MessageReceived!
 activeStatusUpdated:activeStatusUpdated!
 likedNotification: [LikedNotification!]! 
 notificationMarkedRead:notificationMarkedRead!
 followNotification(userId:String!):[LikedNotification!]! 
 
`
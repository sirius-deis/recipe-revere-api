import gql from "graphql-tag";

const typeDefs = gql`
  input userPassword {
    password: String!
  }

  input updatePasswordInput {
    newPassword: String!
    newPasswordConfirm: String!
    password: String!
  }

  input userEmail {
    email: String!
  }

  input userInput {
    email: String!
    password: String!
    passwordConfirm: String
  }

  input userInfoInput {
    name: String
  }

  type User {
    _id: ID!
    name: String
    email: String
    role: String
    pictures: [String]
  }

  type UserWithToken {
    user: User
    token: String
  }

    type UsersWithAmount {
    users: [User]
    amount: Int
  }

  type Recipe {
    url: String!
    label: String
    image: String
    source: String
    dietLabels: [String]
    healthLabels: [String]
    cautions: [String]
    ingredientLines: [String]
    calories: Float
    totalWeight: Float
    totalTime: Float
    cuisineType: [String]
    mealType: [String]
    dishType: [String]
  }

  type Review {
    _id: String!
    userId: String!
    review: String
    rating: Int!
  }

  type RecipeWithAvgRating {
    url: String!
    label: String
    image: String
    source: String
    dietLabels: [String]
    healthLabels: [String]
    cautions: [String]
    ingredientLines: [String]
    calories: Float
    totalWeight: Float
    totalTime: Float
    cuisineType: [String]
    mealType: [String]
    dishType: [String]
    
    avgRating: Float
  }

  type RecipeWithReviewsAndAvgRating {
    recipe: Recipe!
    reviews: [Review]
    avgRating: Float
    amountOfReviews: Int
  }

  type ConversationsWithCount {
    conversations: [Conversation]
    conversationsCount: Int
  }

  type Message {
    _id: String
    messageBody: String
    senderId: String
    parentMessageId: ID
    createDate: Int
    isRead: Boolean
  }

  type Activity {
    _id: String
    userId: User
    activity: String
    date: Int
  }

  type Conversation {
    _id: ID!
    name: String!
    creatorId: String!
    publicity: String
    type: String!
    requests: [User]
    members: [User]
    messages: [Message]
  }



  

  input resetPasswordInput {
    newPassword: String!
    newPasswordConfirm: String!
  }

  input reviewInput {
    recipeId: String!
    reviewText: String
    rating: Int
  }

  input reviewId {
    id: String!
  }

  input reviewIdWithMessage {
    reviewId: String!
    message: String!
  }

  input recipeId {
    recipeId: String!
  }

  input userId {
    userToAddId: String!
  }

  input friendRequest {
    userToAddId: String!
    isAccepted: Boolean!
  }

  input conversationNameWithType {
    conversationName: String!
    conversationType: String
  }

  input conversationId {
    conversationId: String!
  }

  input conversationIdWithNewName {
    conversationId: String!
    newName: String!
  }

  input conversationIdWithUsersId {
    conversationId: String!
    usersId: [String]!
  }

  input conversationIdWithUserId {
    conversationId: String!
    userId: String!
  }

  input conversationIdWithMessage {
    conversationId: String!
    message: String!
    parentMessageId: String
  }

  input conversationIdWithMessageId {
    conversationId: String!
    messageId: String!
  }

  input messageIdWithText {
    conversationId: String!
    messageId: String!
    messageText: String!
  }

  type Mutation {
    register(input: userInput!): Boolean
    login(input: userInput!): UserWithToken
    delete(input: userPassword!): Boolean
    updatePassword(input: updatePasswordInput!): String
    updateInfo(input: userInfoInput!): Boolean
    forgetPassword(input: userEmail!): String
    reviewRecipe(input: reviewInput): Boolean
    removeReviewFromRecipe(input: reviewId): Boolean
    changeReview(input: reviewInput): Boolean
    report(input: reviewIdWithMessage): Boolean
    addToFavorite(input: recipeId): Boolean
    sendRequestToFriends(input: userId): Boolean
    removeFromFriends(input: userId): Boolean
    processFriendRequest(input: friendRequest): Boolean
    blockUser(input: userId): Boolean
    addToShoppingList(input: recipeId): Boolean
    unblockUser(input: userId): Boolean
    createConversation(input: conversationNameWithType): Boolean
    deleteConversation(input: conversationId): Boolean
    changeConversationName(input: conversationIdWithNewName): Boolean
    addUsersToConversation(input: conversationIdWithUsersId): Boolean
    removeUserFromConversation(input: conversationIdWithUserId): Boolean
    enterConversation(input: conversationId): Boolean
    leaveConversation(input: conversationId): Boolean

    sendMessage(input: conversationIdWithMessage): Boolean
    deleteMessage(input: conversationIdWithMessageId): Boolean
    editMessage(input: messageIdWithText): Boolean
    likeMessage(input: conversationIdWithMessageId): Boolean
  }

  type Query {
    getUser(userId: String!): User
    getUsers(page: Int): UsersWithAmount
    logout: Boolean
    getRecipes(query: String, tags: String[], page: Int): [RecipeWithAvgRating]
    getRecipe(id: String, tags: [String]): RecipeWithReviewsAndAvgRating
    forgetPassword(email: String!): String!
    getFavorites: [Recipe]
    getConversations(query: String!, page: Int, limit: Int, tags: [String]): ConversationsWithCount

    getMessages(conversationId: String): [Message]
    getSavedRecipes: [Recipe]

    getFriendsActivity: [Activity]
  }
`;

export default typeDefs;

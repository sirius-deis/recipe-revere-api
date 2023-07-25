import gql from 'graphql-tag';

const typeDefs = gql`
  input userPassword {
    password: String!
  }

  input updatePasswordInput {
    newPassword: String!
    newPasswordConfirm: String!
    password: String!
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
    id: ID!
    name: String
    email: String
    role: String
    pictures: [String]
  }

  type UserWithToken {
    user: User
    token: String
  }

  type Mutation {
    register(input: userInput!): Boolean
    login(input: userInput!): UserWithToken
    delete(input: userPassword!): Boolean
    updatePassword(input: updatePasswordInput!): String
    updateInfo(input: userInfoInput!): Boolean
  }

  type UsersWithAmount {
    users: [User]
    amount: Int
  }

  type Recipe {
    url: String
    label: String
    image: String
    source: String
    dietLabels: [String]
    healthLabels: [String]
    cautions: [String]
    ingredientLines: [String]
    calories: Int
    totalWeight: Int
    totalTime: Int
    cuisineType: [String]
    mealType: [String]
    dishType: [String]
  }

  type Query {
    getUser(userId: String!): User
    getUsers(page: Int): UsersWithAmount
    logout: Boolean
    getRecipes(query: String!, page: Int): [Recipe]
    getRecipe(id: String!): Recipe
  }
`;

export default typeDefs;

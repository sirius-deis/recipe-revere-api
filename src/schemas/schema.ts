import gql from 'graphql-tag';

const typeDefs = gql`
  input userPassword {
    password: String!
  }

  input newPassword {
    newPassword: String!
    newPasswordConfirm: String!
  }

  input userInput {
    email: String!
    password: String!
    passwordConfirm: String!
  }

  input userInfoInput {
    email: String
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
    register(input: userInput): Boolean
    login(input: userInput): UserWithToken
    delete(input: userPassword): Boolean
    updatePassword(input: userPassword, input: newPassword): String
    update(input: userInfoInput): Boolean
  }

  type UsersWithAmount {
    users: [User]
    amount: Int
  }

  type Query {
    getUser(userId: String): User
    getUsers(page: Int): UsersWithAmount
    logout: Boolean
  }
`;

export default typeDefs;

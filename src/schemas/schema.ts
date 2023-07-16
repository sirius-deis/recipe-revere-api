import gql from 'graphql-tag';

const typeDefs = gql`
  input userPassword {
    password: String!
  }

  input userInput {
    email: String!
    password: String!
    passwordConfirm: String
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
  }

  type UsersWithAmount {
    users: [User]
    amount: Int
  }

  type Query {
    getUser(userId: String): User
    getUsers(page: Int): UsersWithAmount
  }
`;

export default typeDefs;

import gql from 'graphql-tag';

const typeDefs = gql`
  input userInput {
    email: String!
    password: String!
    passwordConfirm: String
  }

  type Mutation {
    register(input: userInput): Boolean
    login(input: userInput): User
  }

  type User {
    id: ID!
    name: String
    email: String
    role: String
    pictures: [String]
    token: String
  }

  type Query {
    getUser(id: String): User
    getUsers: [User]
  }
`;

export default typeDefs;

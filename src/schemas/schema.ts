import gql from 'graphql-tag';

const typeDefs = gql`

  type Mutation {

  }

  type User {
    id: ID!
    name: String
    email: String
    password: String
    role: String
    pictures: [String]
  }

  type Query {
    login: User
    getUserInfo(id: String): User
    getUsersInfo: [User]
  }
  
`;

export default typeDefs;

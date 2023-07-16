import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
dotenv.config();
import typeDefs from './schemas/schema';
import resolvers from './resolvers/resolver';

const server = new ApolloServer({ typeDefs, resolvers });

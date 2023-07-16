import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import http from 'http';
dotenv.config();
import typeDefs from './schemas/schema.js';
import resolvers from './resolvers/resolver.js';
import app from './app.js';
import logger from './api/logger.js';

const { PORT = 3000 } = process.env;

interface Context {
  token?: string;
}

const httpServer = http.createServer(app);

const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();

app.use('/', expressMiddleware(server));

await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
logger.info(`Server ready at http://localhost:${PORT}/graphql`);

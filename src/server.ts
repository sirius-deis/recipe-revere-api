import dotenv from 'dotenv';
dotenv.config();
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import http from 'http';
import typeDefs from './schemas/schema.js';
import resolvers from './resolvers/resolver.js';
import connect from './db/connection.js';
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
  includeStacktraceInErrorResponses: false,
});

await server.start();

app.use('/', expressMiddleware(server));

const start = async () => {
  await connect();
  httpServer.listen({ port: PORT }, () => {
    logger.info(`Server ready at http://localhost:${PORT}/graphql`);
  });
};

await start();

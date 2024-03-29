import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import http from "http";
import { Request, Response, NextFunction } from "express";
import errorHandler from "./controllers/error.controllers.js";
import AppError from "./utils/appError.js";
import typeDefs from "./schemas/schema.js";
import resolvers from "./resolvers/resolver.js";
import connect from "./db/connection.js";
import app from "./app.js";
import logger from "./api/logger.js";
import verifyToken from "./utils/tokenVerification.js";
import { redisConnect } from "./db/redisConnection.js";

const { PORT = 3000 } = process.env;

interface IContext {
  token?: string;
}

const httpServer = http.createServer(app);

const server = new ApolloServer<IContext>({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  includeStacktraceInErrorResponses: false,
});

await server.start();

app.use(
  "/",
  expressMiddleware(server, {
    context: verifyToken,
  })
);

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  return next(
    new AppError(`Can't find ${req.originalUrl} on this server`, 404)
  );
});

app.use(errorHandler);

const start = async () => {
  await connect();
  await redisConnect();
  httpServer.listen({ port: PORT }, () => {
    logger.info(`Server ready at http://localhost:${PORT}/graphql`);
  });
};

await start();

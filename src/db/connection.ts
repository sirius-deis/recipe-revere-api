import mongoose, { ConnectOptions } from "mongoose";
import logger from "../api/logger.js";

const { DB_USERNAME, DB_PASSWORD } = process.env;

type ConnectionOptionsExtend = {
  useNewUrlParser: boolean;
  useUnifiedTopology: boolean;
};

const options: ConnectOptions & ConnectionOptionsExtend = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const connect = async () => {
  mongoose.set(
    "debug",
    (collectionName: string, method: string, query: string, doc: string) =>
      logger.debug(
        `${collectionName}.${method}: ${JSON.stringify(query)}, ${doc}`
      )
  );

  mongoose.connection
    .on("open", () => logger.info("Connection with DB established"))
    .on("close", () => logger.info("Connection with DB closed"))
    .on("error", logger.error);

  await mongoose.connect(
    `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@mycluster.mjg9eco.mongodb.net/?retryWrites=true&w=majority&appName=MyCluster`,
    options
  );
};

export default connect;

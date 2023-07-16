import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

const app = express();

const corsOptions = {
  origin: true,
  credentials: true,
};

const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour',
});

const isDevelopment = process.env.NODE_ENV !== 'development';

app.use(cors<cors.CorsRequest>(corsOptions));
app.use(express.json());
app.use(compression());
app.use(
  helmet({
    crossOriginEmbedderPolicy: !isDevelopment,
    contentSecurityPolicy: !isDevelopment,
  }),
);
app.use(mongoSanitize());
app.use(limiter);

export default app;

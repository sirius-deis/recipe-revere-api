import { Schema, model, Model } from 'mongoose';

interface IToken {
  id: string;
  userId: string;
  token: string;
  createdAt: { type: Date; validate: {} };
}

type ITokenModel = Model<IToken, {}>;

const tokenSchema = new Schema<IToken, ITokenModel>({
  userId: {
    type: String,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    require: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    expires: 60 * 60 * 24 * 3,
    validate: {
      validator: function (v: number) {
        return v < Date.now();
      },
      message: (props: { v: number }) => `Value ${props.v} is invalid. Please provide valid data`,
    },
  },
});

const Token = model<IToken>('Token', tokenSchema);

export default Token;

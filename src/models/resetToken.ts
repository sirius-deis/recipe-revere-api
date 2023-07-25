import { Schema, model, Model, Types } from 'mongoose';

interface IResetToken {
  userId: string;
  token: string;
  createdAt: { type: Date; validate: {} };
}

type IResetTokenModel = Model<IResetToken, {}>;

const resetTokenSchema = new Schema<IResetToken, IResetTokenModel>({
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
    validate: {
      validator: function (v: number) {
        return v < Date.now();
      },
      message: (props: { v: number }) => `Value ${props.v} is invalid. Please provide valid data`,
    },
  },
});

const ResetToken = model<IResetToken>('ResetToken', resetTokenSchema);

export default ResetToken;

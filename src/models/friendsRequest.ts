import { Schema, Model, model, Types } from "mongoose";

interface IFriendsRequest {
  _id: Types.ObjectId;
  requester: Types.ObjectId;
  recipient: Types.ObjectId;
  status: Types.Decimal128;
}

type FriendsRequestModel = Model<IFriendsRequest, {}>;

const FriendsRequestSchema = new Schema<IFriendsRequest, FriendsRequestModel>({
  requester: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  recipient: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  status: {
    type: Schema.Types.Decimal128,
    required: true,
    enum: [
      0, //'add friend',
      1, //'requested',
      2, //'pending',
      3, //'friends'
    ],
  },
});

const FriendsRequest = model<IFriendsRequest, FriendsRequestModel>(
  "FriendsRequest",
  FriendsRequestSchema
);

export default FriendsRequest;

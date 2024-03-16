import { Schema, Model, model, Types } from "mongoose";

interface IFriendRequest {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  requesterId: Types.ObjectId;
}

type FriendRequestModel = Model<IFriendRequest, {}>;

const FriendRequestSchema = new Schema<IFriendRequest, FriendRequestModel>({
  userId: Types.ObjectId,
  requesterId: Types.ObjectId,
});

const FriendRequest = model<IFriendRequest>(
  "FriendRequest",
  FriendRequestSchema
);

export default FriendRequest;

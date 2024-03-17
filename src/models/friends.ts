import { Schema, Model, model, Types } from "mongoose";

interface IFriends {
  _id: Types.ObjectId;
  requester: Types.ObjectId;
  recipient: Types.ObjectId;
  status: Types.Decimal128;
}

type FriendsModel = Model<IFriends, {}>;

const FriendsSchema = new Schema<IFriends, FriendsModel>({
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

const Friends = model<IFriends, FriendsModel>("Friends", FriendsSchema);

export default Friends;

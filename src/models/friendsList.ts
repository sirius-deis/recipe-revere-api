import { Schema, Model, model, Types } from "mongoose";

interface IFriendsList {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  friendId: Types.ObjectId;
}

type FriendsListModel = Model<IFriendsList, {}>;

const FriendsListSchema = new Schema<IFriendsList, FriendsListModel>({
  userId: Types.ObjectId,
  friendId: Types.ObjectId,
});

const FriendsList = model<IFriendsList>("FriendList", FriendsListSchema);

export default FriendsList;

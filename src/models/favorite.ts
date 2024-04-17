import { Schema, Model, model, Types } from "mongoose";

interface IFavorite {
  _id: Types.ObjectId;
  recipeIds: Types.Array<Types.ObjectId>;
  userId: Types.ObjectId;
}

type FavoriteModel = Model<IFavorite, {}>;

const FavoriteSchema = new Schema<IFavorite, FavoriteModel>({
  recipeIds: {
    type: [Schema.Types.ObjectId],
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    unique: true,
  },
});

const Favorite = model<IFavorite>("Favorite", FavoriteSchema);

export default Favorite;

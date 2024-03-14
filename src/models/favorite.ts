import { Schema, Model, model, Types } from "mongoose";

interface IFavorite {
  _id: Types.ObjectId;
  recipeId: Types.ObjectId;
  userId: Types.ObjectId;
}

type FavoriteModel = Model<IFavorite, {}>;

const FavoriteSchema = new Schema<IFavorite, FavoriteModel>({
  recipeId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
});

const Favorite = model<IFavorite>("Favorite", FavoriteSchema);

export default Favorite;

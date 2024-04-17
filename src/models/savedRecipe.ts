import { Schema, Model, model, Types } from "mongoose";

interface ISavedRecipe {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  recipeIds: Types.Array<Types.ObjectId>;
}

type SavedRecipeModel = Model<ISavedRecipe, {}>;

const SavedRecipeSchema = new Schema<ISavedRecipe, SavedRecipeModel>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    unique: true,
  },
  recipeIds: {
    type: [Schema.Types.ObjectId],
    required: true,
  },
});

const SavedRecipe = model<ISavedRecipe>("SavedRecipe", SavedRecipeSchema);

export default SavedRecipe;

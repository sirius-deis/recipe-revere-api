import { Schema, Model, model, Types } from "mongoose";

interface ISavedRecipe {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  recipeIds: Types.Array<Types.ObjectId>;
}

interface ISavedRecipeMethods {
  save: () => Promise<ISavedRecipe | never>;
}

type SavedRecipeModel = Model<ISavedRecipe, {}, ISavedRecipeMethods>;

const SavedRecipeSchema = new Schema<
  ISavedRecipe,
  SavedRecipeModel,
  ISavedRecipeMethods
>({
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

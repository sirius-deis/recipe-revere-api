import { Schema, Model, model, Types } from 'mongoose';

interface IRecipeReview {
  _id: Types.ObjectId;
  recipeId: string;
  userId: Types.ObjectId;
  rating: number;
  review: string;
}

type RecipeReviewModel = Model<IRecipeReview, {}>;

const recipeReviewSchema = new Schema<IRecipeReview, RecipeReviewModel>({
  recipeId: {
    type: String,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  review: {
    type: String,
    maxlength: 256,
  },
});

const RecipeReview = model<IRecipeReview>('RecipeReview', recipeReviewSchema);

export default RecipeReview;

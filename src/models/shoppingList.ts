import { Schema, Model, model, Types } from "mongoose";

interface IShoppingList {
  _id: Types.ObjectId;
  recipeId: Types.ObjectId;
  userId: Types.ObjectId;
}

type ShoppingListModel = Model<IShoppingList, {}>;

const ShoppingListSchema = new Schema<IShoppingList, ShoppingListModel>({
  recipeId: Schema.Types.ObjectId,
  userId: Schema.Types.ObjectId,
});

const ShoppingList = model<IShoppingList>("ShoppingList", ShoppingListSchema);

export default ShoppingList;

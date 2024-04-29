import { Schema, Model, model, Types } from "mongoose";

interface IShoppingList {
  _id: Types.ObjectId;
  recipeId: Types.ObjectId;
  userId: Types.ObjectId;
}

interface IShoppingListMethods {
  destroy: () => Promise<void | never>;
}

type ShoppingListModel = Model<IShoppingList, {}, IShoppingListMethods>;

const ShoppingListSchema = new Schema<
  IShoppingList,
  ShoppingListModel,
  IShoppingListMethods
>({
  recipeId: Schema.Types.ObjectId,
  userId: Schema.Types.ObjectId,
});

const ShoppingList = model<IShoppingList, ShoppingListModel>(
  "ShoppingList",
  ShoppingListSchema
);

export default ShoppingList;

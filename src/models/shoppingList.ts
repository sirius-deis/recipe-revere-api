import { Schema, Model, model, Types } from "mongoose";

interface IShoppingList {
  _id: Types.ObjectId;
  recipeId: Types.ObjectId;
  userId: Types.ObjectId;
  bought: string[];
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
  bought: {
    type: [String],
  },
});

const ShoppingList = model<IShoppingList, ShoppingListModel>(
  "ShoppingList",
  ShoppingListSchema
);

export default ShoppingList;

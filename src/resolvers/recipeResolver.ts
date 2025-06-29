import { GraphQLError } from "graphql";
import axios from "axios";
import authWrapper from "../utils/auth.js";
import { setValue, getValue, appendToRedisList, getRedisList } from "../db/redisConnection.js";
import { IUserType } from "../models/user.js";
import RecipeReview from "../models/recipeReview.js";
import Report from "../models/report.js";
import Favorite from "../models/favorite.js";
import ShoppingList from "../models/shoppingList.js";
import SavedRecipe from "../models/savedRecipe.js";
import Activity from "../models/activity.js";
import mongoose from "mongoose";

const { EDAMAM_APPLICATION_ID, EDAMAM_APPLICATION_KEY } = process.env;

const url = `https://api.edamam.com/api/recipes/v2?type=public&app_id=${EDAMAM_APPLICATION_ID}&app_key=${EDAMAM_APPLICATION_KEY}`;
const urlSingle = `https://api.edamam.com/api/recipes/v2/by-uri?type=public&app_id=${EDAMAM_APPLICATION_ID}&app_key=${EDAMAM_APPLICATION_KEY}`;
const uri = "http://www.edamam.com/ontologies/edamam.owl#recipe_";

interface Recipe {
  url: string;
  label: string;
  image: string;
  images: {
    THUMBNAIL: {
      url: string;
      width: number;
      height: number;
    };
    SMALL: {
      url: string;
      width: number;
      height: number;
    };
    REGULAR: {
      url: string;
      width: number;
      height: number;
    };
  };
  source: string;
  dietLabels: [string];
  healthLabels: [string];
  cautions: [string];
  ingredientLines: [string];
  calories: number;
  totalWeight: number;
  totalTime: number;
  cuisineType: [string];
  mealType: [string];
  dishType: [string];
  avgRating?: number;
  amountOfReviews?: number;
}

const extractRecipesFromObject = (recipes: [{ recipe: Recipe }]) => {
  return recipes.map((hit: { recipe: Recipe }) => hit.recipe);
};

const findAverageRatingAndAmount = async (
  recipeId: string
): Promise<[number, number]> => {
  const result = await RecipeReview.aggregate([
    {
      $group: {
        _id: recipeId,
        averageRating: { $avg: "$rating" },
        amountOfReviews: { $sum: 1 },
      },
    },
  ]);
  return [result[0]?.averageRating, result[0]?.amountOfReviews];
};

const fetchRecipesToPage = async (
  currentCursor: number,
  page: number,
  currentLink: string,
  recipesFromRedis?: any
) => {
  const recipesToInsert: any = {};
  let nextLink = currentLink;
  let count = currentCursor;

  while (count > 0) {
    if (recipesFromRedis && recipesFromRedis[count.toString()]) {
      nextLink = recipesFromRedis[count.toString()].next;
      count++;
      break;
    }
    count--;
  }

  count ||= 1;
  while (count < page) {
    const tempResponse = await axios.get(nextLink);
    const data = tempResponse.data;
    nextLink = data._links.next.href;
    recipesToInsert[count.toString()] = {
      hits: data.hits,
      next: data._links.next.href,
    };
    count++;
  }

  const response = await axios.get(nextLink);
  return { response, recipesToInsert };
};

const findReviews = async (recipeId: string) =>
  await RecipeReview.find({ recipeId });

const extractIdsFromRecipes = (recipes: Recipe[]): string[] => {
  return recipes.map((recipe) => recipe.url.replace(uri, ""));
};

const attachAverageRatingForAllRecipes = async (
  recipes: Recipe[]
): Promise<Recipe[]> => {
  const recipesId = extractIdsFromRecipes(recipes);
  const avgRating = await Promise.all(
    recipesId.map((id) => findAverageRatingAndAmount(id))
  );

  for (let i = 0; i < recipes.length; i++) {
    recipes[i].avgRating = avgRating[i][0];
    recipes[i].amountOfReviews = avgRating[i][1];
  }

  return recipes;
};

const fetchRecipeAndSaveToRedis = async (recipeId: string): Promise<Recipe> => {
  const response = await axios.get(urlSingle, {
    params: { uri: `${uri}${recipeId}`, },
  });
  const data = response.data;
  if (data.hits.length < 1) {
    throw new GraphQLError("Recipe with provide id does not exist", {
      extensions: {
        code: "NOT_FOUND",
        http: { status: 404 },
      },
    });
  }
  const recipeFromResponse = data.hits[0].recipe;
  await setValue(`recipe-${recipeFromResponse.url}`, recipeFromResponse);
  return recipeFromResponse;
};

const getFromStoreOrFetch = async (recipeId: string): Promise<Recipe> => {
  const recipeFromRedis = await getValue(`recipe-${recipeId}`);
  if (recipeFromRedis) {
    return recipeFromRedis;
  }
  return await fetchRecipeAndSaveToRedis(recipeId);
};

const fetchRecipesByIds = async (recipeIds: string[]): Promise<Recipe[]> => {
  const recipeList: Recipe[] = await Promise.all(
    recipeIds.map((recipeId) => {
      return getFromStoreOrFetch(recipeId);
    })
  );
  return recipeList;
};

const checkIfTagsExistAndAllowed = (tags: string[], allowedTags: string[]) => {
  if (!tags) {
    return
  }
  if (tags && !tags.length) {
    throw new GraphQLError("You need to provide at least one tag", {
      extensions: {
        code: "INPUT_ERROR",
        http: { status: 400 }
      }
    })
  }

  if (allowedTags.length) {
    const isTagValid = tags.every((tag) => allowedTags.includes(tag))
    if (!isTagValid) {
      throw new GraphQLError("Unsupported tag", {
        extensions: {
          code: "INPUT_ERROR",
          http: { status: 400 }
        }
      })
    }
  }
}

const removeDuplicateRecipes = (recipes: Recipe[]): Recipe[] => recipes.filter((recipe: Recipe, index: number, self: Recipe[]) => {
  return self.findIndex((r: Recipe) => r.url === recipe.url) != -1;
})

const buildStringFromTags = (tags: { type: string, tag: string }[]) => {
  return tags.reduce((acc, tag) => acc + `${tag.type}=${tag.tag}`, "")
}

const recipeResolver = {
  // add fetching recipes by query and by tags from redis
  getRecipes: authWrapper(
    async (
      _: any,
      args: { query: string; tags: { type: string, tag: string }[], page: number; size: number },
      __: any
    ) => {
      const { query, tags, page = 1, size } = args;

      if (page < 1) {
        throw new GraphQLError("Page can't be zero or negative value", {
          extensions: {
            code: "RANGE_ERROR",
            http: { status: 400 },
          },
        });
      }

      let recipesFromRedis;

      const q = `${url}&${query ? `q=${query}` : ""}${buildStringFromTags(tags)}`;


      if (query) {
        recipesFromRedis = await getValue(`recipes_pages_q:${q}`);
      } else if (tags && tags.length) {
        const idsByTag = await getRedisList(`recipe_tags:${buildStringFromTags(tags)}`);
        const recipesByTag = await fetchRecipesByIds(idsByTag);
        recipesFromRedis = removeDuplicateRecipes(recipesByTag);
      } else {
        throw new GraphQLError("You need to provide query or tags", {
          extensions: {
            code: "INPUT_ERROR",
            http: { status: 400 }
          }
        })
      }

      if (recipesFromRedis && recipesFromRedis[page.toString()]) {
        return await attachAverageRatingForAllRecipes(
          extractRecipesFromObject(recipesFromRedis[page.toString()].hits)
        );
      }

      let response;
      let recipesToInsert: any = {};

      if (recipesFromRedis && page > 1) {
        const prevPage = page - 1;
        const prevPageFromDB = recipesFromRedis[prevPage.toString()];
        if (prevPageFromDB) {
          response = await axios.get(prevPageFromDB.next);
        } else {
          let count = prevPage;
          const result = await fetchRecipesToPage(
            count,
            page,
            q,
            recipesFromRedis
          );
          response = result.response;
          recipesToInsert = result.recipesToInsert;
        }
      } else {
        const result = await fetchRecipesToPage(1, page, q);
        response = result.response;
        recipesToInsert = result.recipesToInsert;
      }

      const data = response.data;

      if (data.hits.length < 1) {
        throw new GraphQLError("There are no recipes left", {
          extensions: {
            code: "NOT_FOUND",
            http: { status: 404 },
          },
        });
      }

      await setValue(`recipes_pages_q:${q}`, {
        ...recipesFromRedis,
        ...recipesToInsert,
        [page.toString()]: { hits: data.hits, next: data._links.next.href },
      });
      return await attachAverageRatingForAllRecipes(
        extractRecipesFromObject(data.hits)
      );
    }
  ),
  getRecipe: authWrapper(async (_: any, args: { id: string, tags: string[] }, __: any) => {
    let { id } = args
    const { tags } = args;
    checkIfTagsExistAndAllowed(tags, ["RECIPE_OF_THE_DAY"])

    if (!id && tags[0]) {
      if (process.env.NODE_ENV !== 'development') {
        id = "c381c46e34e7bbaee72f4b2de2a503d1"
      } else {
        id = (await getRedisList(tags[0]))[0];
      }
      if (!id) {
        throw new GraphQLError(`Ups, recipe with the tag ${tags[0]} was not found. Wait until we update it`, {
          extensions: {
            code: "NOT_FOUND",
            http: { status: 404 },
          },
        });
      }
    }

    const recipeFromRedis = await getValue(`recipe-${id}`);
    if (recipeFromRedis) {
      const [reviews, [averageRating, amountOfReviews]] = await Promise.all([
        findReviews(id),
        findAverageRatingAndAmount(id),
      ]);
      return {
        recipe: recipeFromRedis,
        reviews,
        averageRating,
        amountOfReviews,
      };
    }
    const recipe = await fetchRecipeAndSaveToRedis(id);
    const [reviews, [averageRating, amountOfReviews]] = await Promise.all([
      findReviews(id),
      findAverageRatingAndAmount(id),
    ]);

    return {
      recipe,
      reviews,
      averageRating,
      amountOfReviews,
    };
  }),
  reviewRecipe: authWrapper(
    async (
      _: any,
      {
        input,
      }: {
        input: {
          recipeId: string;
          reviewInput: string;
          rating: number;
          title: string;
        };
      },
      { user }: { user: IUserType }
    ) => {
      const { recipeId, reviewInput, rating, title } = input;

      const review = await RecipeReview.findOne({ recipeId, userId: user._id });
      if (review) {
        throw new GraphQLError(
          "You can't create more than one review for each recipe",
          {
            extensions: {
              code: "INPUT_ERROR",
              http: { status: 400 },
            },
          }
        );
      }

      const recipeFromRedis = await getValue(`recipe-${recipeId}`);
      if (!recipeFromRedis) {
        const response = await axios.get(urlSingle, {
          params: { uri: `${uri}${recipeId}` },
        });
        const data = response.data;
        if (data.hits.length < 1) {
          throw new GraphQLError("Recipe with provide id does not exist", {
            extensions: {
              code: "NOT_FOUND",
              http: { status: 404 },
            },
          });
        } else {
          const recipeFromResponse = data.hits[0].recipe;
          await setValue(
            `recipe-${recipeFromResponse.url}`,
            recipeFromResponse
          );
        }
      }

      await Promise.all([
        RecipeReview.create({
          recipeId,
          userId: user._id,
          review: reviewInput,
          rating,
        }),
        Activity.create({
          userId: user._id,
          activity: `added a review to a <link to='/recipe/${recipeId}'>${title}</link>`,
          date: Date.now(),
        }),
      ]);

      return true;
    }
  ),
  removeReviewFromRecipe: authWrapper(
    async (
      _: any,
      { input }: { input: { id: string } },
      { user }: { user: IUserType }
    ) => {
      const { id: reviewId } = input;

      const review = await RecipeReview.findOne({
        _id: reviewId,
        userId: user._id,
      });

      if (!review) {
        throw new GraphQLError("Recipe with provide id does not exist", {
          extensions: {
            code: "NOT_FOUND",
            http: { status: 404 },
          },
        });
      }

      if (!user._id.equals(review.userId)) {
        throw new GraphQLError("You can't change review that are not your", {
          extensions: {
            code: "FORBIDDEN",
            http: { status: 403 },
          },
        });
      }

      await review.deleteOne();

      return true;
    }
  ),
  changeReview: authWrapper(
    async (
      _: any,
      {
        input,
      }: { input: { reviewId: string; reviewText: string; rating: number } },
      { user }: { user: IUserType }
    ) => {
      const { reviewId, reviewText, rating } = input;

      const review = await RecipeReview.findById(reviewId);
      if (!review) {
        throw new GraphQLError("Recipe with provide id does not exist", {
          extensions: {
            code: "NOT_FOUND",
            http: { status: 404 },
          },
        });
      }

      if (!user._id.equals(review.userId)) {
        throw new GraphQLError("You can't change review that are not your", {
          extensions: {
            code: "FORBIDDEN",
            http: { status: 403 },
          },
        });
      }

      if (!reviewText && !rating) {
        throw new GraphQLError(
          "You need to provide at least one changed value",
          {
            extensions: {
              code: "INPUT_ERROR",
              http: { status: 400 },
            },
          }
        );
      }

      if (reviewText) {
        if (reviewText.trim().length < 1) {
          throw new GraphQLError(
            "Review should contain at least one character",
            {
              extensions: {
                code: "INPUT_ERROR",
                http: { status: 400 },
              },
            }
          );
        }
        review.review = reviewText;
      }
      if (rating) {
        if (rating < 1 && rating > 5) {
          throw new GraphQLError(
            "Rating can't be less than 1 and grater than 5",
            {
              extensions: {
                code: "INPUT_ERROR",
                http: { status: 400 },
              },
            }
          );
        }
        review.rating = rating;
      }

      await review.save();

      return true;
    }
  ),
  report: authWrapper(
    async (
      _: any,
      { input }: { input: { reviewId: string; message: string } },
      { user }: { user: IUserType }
    ) => {
      const { reviewId, message } = input;

      const review = await RecipeReview.findById(reviewId);

      if (!review) {
        throw new GraphQLError("There is no review with such id", {
          extensions: {
            code: "NOT_FOUND",
            http: { status: 404 },
          },
        });
      }

      if (review.userId.equals(user._id)) {
        throw new GraphQLError("You can't report your own reviews", {
          extensions: {
            code: "INPUT_ERROR",
            http: { status: 400 },
          },
        });
      }

      if (message.trim().length < 12) {
        throw new GraphQLError(
          "Message should be at least 12 characters long",
          {
            extensions: {
              code: "INPUT_ERROR",
              http: { status: 400 },
            },
          }
        );
      }

      await Report.create({ reviewId, senderId: user._id, message });

      return true;
    }
  ),
  addToFavorite: authWrapper(
    async (
      _: any,
      { input }: { input: { recipeId: string; title: string } },
      { user }: { user: IUserType }
    ) => {
      const { recipeId, title } = input;

      const favorite = await Favorite.findById(recipeId);

      let action = "";

      if (!favorite) {
        // await fetchRecipeAndSaveToRedis(recipeId);

        await Favorite.create({ recipeId, userId: user._id });
        action = "add";
      } else {
        await Favorite.findOneAndDelete({ recipeId });
        action = "remove";
      }

      await Activity.create({
        userId: user._id,
        activity: `${action} ${title}`,
        date: Date.now(),
      });

      return true;
    }
  ),
  getFavorites: authWrapper(
    async (_: any, __: any, { user }: { user: IUserType }) => {
      const favoriteIds = await Favorite.findById(user._id);

      if (!favoriteIds?.recipeIds) {
        return [];
      }

      return await fetchRecipesByIds(
        favoriteIds?.recipeIds.map((recipeId) => recipeId.toString())
      );
    }
  ),
  addToShoppingList: authWrapper(
    async (
      _: any,
      { input }: { input: { recipeId: string; title: string } },
      { user }: { user: IUserType }
    ) => {
      const { recipeId, title } = input;

      const recipeInShoppingList = await ShoppingList.findById(recipeId);

      if (recipeInShoppingList) {
        return true;
      }

      await Promise.all([
        ShoppingList.create({ recipeId, userId: user._id }),
        Activity.create({
          userId: user._id,
          activity: `added ${title}`,
          date: Date.now(),
        }),
      ]);

      return true;
    }
  ),
  removeFromShoppingList: authWrapper(
    async (
      _: any,
      { input }: { input: { recipeId: string; title: string } },
      { user }: { user: IUserType }
    ) => {
      const { recipeId, title } = input;
      const recipeInShoppingList = await ShoppingList.findById(recipeId);

      if (!recipeInShoppingList) {
        throw new GraphQLError("Recipe with provided id wasn't found", {
          extensions: {
            code: "NOT_FOUND",
            http: { status: 404 },
          },
        });
      }

      await Promise.all([
        recipeInShoppingList.destroy(),
        Activity.create({
          userId: user._id,
          activity: `removed ${title}`,
          date: Date.now(),
        }),
      ]);

      return true;
    }
  ),
  getShoppingList: authWrapper(
    async (_: any, __: any, { user }: { user: IUserType }) => {
      //TODO: add fetching recipes listed in shopping list
      const shoppingList = await ShoppingList.find({ userId: user._id });

      return shoppingList;
    }
  ),
  getSingleFromShoppingList: authWrapper(
    async (
      _: any,
      { input }: { input: { singleShoppingListId: string } },
      { user }: { user: IUserType }
    ) => {
      const { singleShoppingListId } = input;
      const shoppingListSingle = await ShoppingList.findOne({
        _id: new mongoose.Types.ObjectId(singleShoppingListId),
        userId: user._id,
      });

      if (!shoppingListSingle) {
        throw new GraphQLError("Recipe with provided id wasn't found", {
          extensions: {
            code: "NOT_FOUND",
            http: { status: 404 },
          },
        });
      }

      return shoppingListSingle;
    }
  ),
  addToSavedRecipes: authWrapper(
    async (
      _: any,
      { input }: { input: { recipeId: string; title: string } },
      { user }: { user: IUserType }
    ) => {
      const { recipeId, title } = input;

      const savedRecipes = await SavedRecipe.findOne({
        userId: user._id,
      });

      let action = "";

      if (!savedRecipes?.recipeIds.find((id) => id.equals(recipeId))) {
        savedRecipes?.recipeIds.push(recipeId);
        action = "saved";
      } else {
        const id = savedRecipes?.recipeIds.findIndex((id) =>
          id.equals(recipeId)
        );
        savedRecipes.recipeIds.splice(id, 1);
        action = "removed";
      }

      await Promise.all([
        savedRecipes?.save(),
        Activity.create({
          userId: user._id,
          activity: `${action} ${title}`,
          date: Date.now(),
        }),
      ]);

      return true;
    }
  ),
  getSavedRecipes: authWrapper(
    async (
      _: any,
      { input }: { input: { size: number } },
      { user }: { user: IUserType }
    ) => {
      const { size } = input;
      const savedRecipes = await SavedRecipe.findOne({ userId: user._id });

      if (!savedRecipes?.recipeIds) {
        return [];
      }

      if (size) {
        return await fetchRecipesByIds(
          savedRecipes?.recipeIds
            .map((recipeId) => recipeId.toString())
            .slice(-size)
        );
      }

      return await fetchRecipesByIds(
        savedRecipes?.recipeIds.map((recipeId) => recipeId.toString())
      );
    }
  ),
  setTagsToRecipe: authWrapper(
    async (
      _: any,
      { input }: { input: { recipeId: string, tags: string[] } },
      { user }: { user: IUserType }
    ) => {
      const { recipeId, tags } = input;
      const allowedRoles = ["admin"]
      if (!recipeId || !tags || tags.length < 1) {
        throw new GraphQLError("you need to provide recipeId and tags", {
          extensions: {
            code: "INPUT_ERROR",
            http: { status: 400 }
          }
        })
      }
      if (!allowedRoles.includes(user.role)) {
        throw new GraphQLError("You are not allowed to set tags", {
          extensions: {
            code: "FORBIDDEN",
            http: { status: 403 }
          }
        })
      }

      await Promise.all(tags.map(async (tag) => {
        await appendToRedisList(tag, recipeId)
      }))

      return true
    }

  )
};

export default recipeResolver;

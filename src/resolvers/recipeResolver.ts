import { GraphQLError } from 'graphql';
import axios from 'axios';
import authWrapper from '../utils/auth.js';
import { setValue, getValue } from '../db/redisConnection.js';
import { IUserType } from '../models/user.js';
import RecipeReview from '../models/recipeReview.js';

const { EDAMAM_APPLICATION_ID, EDAMAM_APPLICATION_KEY } = process.env;

const url = `https://api.edamam.com/api/recipes/v2?type=public&app_id=${EDAMAM_APPLICATION_ID}&app_key=${EDAMAM_APPLICATION_KEY}`;
const urlSingle = `https://api.edamam.com/api/recipes/v2/by-uri?type=public&app_id=${EDAMAM_APPLICATION_ID}&app_key=${EDAMAM_APPLICATION_KEY}`;
const uri = 'http://www.edamam.com/ontologies/edamam.owl#recipe_';

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

const findAverageRatingAndAmount = async (recipeId: string): Promise<[number, number]> => {
  const result = await RecipeReview.aggregate([
    { $group: { _id: recipeId, averageRating: { $avg: '$rating' }, amountOfReviews: { $sum: 1 } } },
  ]);
  return [result[0].averageRating, result[0].amountOfReviews];
};

const fetchRecipesToPage = async (
  currentCursor: number,
  page: number,
  currentLink: string,
  recipesFromRedis?: any,
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
    recipesToInsert[count.toString()] = { hits: data.hits, next: data._links.next.href };
    count++;
  }

  const response = await axios.get(nextLink);
  return { response, recipesToInsert };
};

const findReviews = async (recipeId: string) => await RecipeReview.find({ recipeId });

const extractIdsFromRecipes = (recipes: Recipe[]): string[] => {
  return recipes.map((recipe) => recipe.url.replace(uri, ''));
};

const attachAverageRatingForAllRecipes = async (recipes: Recipe[]): Promise<Recipe[]> => {
  const recipesId = extractIdsFromRecipes(recipes);
  const avgRating = await Promise.all(recipesId.map((id) => findAverageRatingAndAmount(id)));

  for (let i = 0; i < recipes.length; i++) {
    recipes[i].avgRating = avgRating[i][0];
    recipes[i].amountOfReviews = avgRating[i][1];
  }

  return recipes;
};

const recipeResolver = {
  getRecipes: authWrapper(
    async (_: any, args: { query: string; page: number; size: number }, __: any) => {
      const { query, page = 1 } = args;

      if (page < 1) {
        throw new GraphQLError("Page can't be zero or negative value", {
          extensions: {
            code: 'Range_Error',
            http: { status: 400 },
          },
        });
      }

      const recipesFromRedis = await getValue(`recipes_pages_q:${query}`);

      if (recipesFromRedis && recipesFromRedis[page.toString()]) {
        return attachAverageRatingForAllRecipes(
          extractRecipesFromObject(recipesFromRedis[page.toString()].hits),
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
            `${url}&q=${query}`,
            recipesFromRedis,
          );
          response = result.response;
          recipesToInsert = result.recipesToInsert;
        }
      } else {
        const result = await fetchRecipesToPage(1, page, `${url}&q=${query}`);
        response = result.response;
        recipesToInsert = result.recipesToInsert;
      }

      const data = response.data;

      if (data.hits.length < 1) {
        throw new GraphQLError('There are no recipes left', {
          extensions: {
            code: 'NOT_FOUND',
            http: { status: 404 },
          },
        });
      }

      await setValue(`recipes_pages_q:${query}`, {
        ...recipesFromRedis,
        ...recipesToInsert,
        [page.toString()]: { hits: data.hits, next: data._links.next.href },
      });

      return attachAverageRatingForAllRecipes(extractRecipesFromObject(data.hits));
    },
  ),
  getRecipe: authWrapper(async (_: any, args: { id: string }, __: any) => {
    const { id } = args;
    const recipeFromRedis = await getValue(`recipe-${id}`);
    if (recipeFromRedis) {
      const [reviews, [averageRating, amountOfReviews]] = await Promise.all([
        findReviews(id),
        findAverageRatingAndAmount(id),
      ]);
      return { recipe: recipeFromRedis, reviews, averageRating, amountOfReviews };
    }
    const response = await axios.get(urlSingle, { params: { uri: `${uri}${id}` } });
    const data = response.data;
    if (data.hits.length < 1) {
      throw new GraphQLError('Recipe with provide id does not exist', {
        extensions: {
          code: 'NOT_FOUND',
          http: { status: 404 },
        },
      });
    }
    const recipeFromResponse = data.hits[0].recipe;
    const [reviews, [averageRating, amountOfReviews]] = await Promise.all([
      findReviews(id),
      findAverageRatingAndAmount(id),
    ]);
    await setValue(`recipe-${recipeFromResponse.url}`, recipeFromResponse);
    return { recipe: recipeFromResponse, reviews, averageRating, amountOfReviews };
  }),
  reviewRecipe: authWrapper(
    async (
      _: any,
      { input }: { input: { recipeId: string; reviewInput: string; rating: number } },
      { user }: { user: IUserType },
    ) => {
      const { recipeId, reviewInput, rating } = input;

      const review = await RecipeReview.findOne({ recipeId, userId: user._id });
      if (review) {
        throw new GraphQLError("You can't create more than one review for each recipe", {
          extensions: {
            code: 'INPUT_ERROR',
            http: { status: 400 },
          },
        });
      }

      const recipeFromRedis = await getValue(`recipe-${recipeId}`);
      if (!recipeFromRedis) {
        const response = await axios.get(urlSingle, { params: { uri: `${uri}${recipeId}` } });
        const data = response.data;
        if (data.hits.length < 1) {
          throw new GraphQLError('Recipe with provide id does not exist', {
            extensions: {
              code: 'NOT_FOUND',
              http: { status: 404 },
            },
          });
        } else {
          const recipeFromResponse = data.hits[0].recipe;
          await setValue(`recipe-${recipeFromResponse.url}`, recipeFromResponse);
        }
      }

      await RecipeReview.create({ recipeId, userId: user._id, review: reviewInput, rating });

      return true;
    },
  ),
  removeReviewFromRecipe: authWrapper(
    async (_: any, { input }: { input: { id: string } }, { user }: { user: IUserType }) => {
      const { id: reviewId } = input;

      const review = await RecipeReview.findOne({ _id: reviewId, userId: user._id });

      if (!review) {
        throw new GraphQLError('Recipe with provide id does not exist', {
          extensions: {
            code: 'NOT_FOUND',
            http: { status: 404 },
          },
        });
      }

      if (!user._id.equals(review.userId)) {
        throw new GraphQLError("You can't change review that are not your", {
          extensions: {
            code: 'FORBIDDEN',
            http: { status: 403 },
          },
        });
      }

      await review.deleteOne();

      return true;
    },
  ),
  changeReview: authWrapper(
    async (
      _: any,
      { input }: { input: { reviewId: string; reviewText: string; rating: number } },
      { user }: { user: IUserType },
    ) => {
      const { reviewId, reviewText, rating } = input;

      const review = await RecipeReview.findById(reviewId);
      if (!review) {
        throw new GraphQLError('Recipe with provide id does not exist', {
          extensions: {
            code: 'NOT_FOUND',
            http: { status: 404 },
          },
        });
      }

      if (!user._id.equals(review.userId)) {
        throw new GraphQLError("You can't change review that are not your", {
          extensions: {
            code: 'FORBIDDEN',
            http: { status: 403 },
          },
        });
      }

      if (!reviewText && !rating) {
        throw new GraphQLError('You need to provide at least one changed value', {
          extensions: {
            code: 'INPUT_ERROR',
            http: { status: 400 },
          },
        });
      }

      if (reviewText) {
        if (reviewText.trim().length < 1) {
          throw new GraphQLError('Review should contain at least one character', {
            extensions: {
              code: 'INPUT_ERROR',
              http: { status: 400 },
            },
          });
        }
        review.review = reviewText;
      }
      if (rating) {
        if (rating < 1 && rating > 5) {
          throw new GraphQLError("Rating can't be less than 1 and grater than 5", {
            extensions: {
              code: 'INPUT_ERROR',
              http: { status: 400 },
            },
          });
        }
        review.rating = rating;
      }

      await review.save();

      return true;
    },
  ),
};

export default recipeResolver;

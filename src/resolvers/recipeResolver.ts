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
}

const extractRecipesFromObject = (recipes: [{ recipe: Recipe }]) => {
  return recipes.map((hit: { recipe: Recipe }) => hit.recipe);
};

const findAverageRating = (recipeId: string) => {
  const averageRating = RecipeReview.aggregate([
    { $group: { _id: recipeId, averageRating: { $avg: '$rating' } } },
  ]);
  return averageRating;
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
    if (recipesFromRedis[count.toString()]) {
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

const recipeResolver = {
  getRecipes: authWrapper(
    async (_: any, args: { query: string; page: number; size: number }, __: any) => {
      const { query, page = 1 } = args;

      if (page < 1) {
        throw new GraphQLError("Page can't be zero or negative value", {
          extensions: {
            code: 'Range_Error',
          },
        });
      }

      const recipesFromRedis = await getValue(`recipes_pages_q:${query}`);

      if (recipesFromRedis && recipesFromRedis[page.toString()]) {
        return extractRecipesFromObject(recipesFromRedis[page.toString()].hits);
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
          },
        });
      }

      await setValue(`recipes_pages_q:${query}`, {
        ...recipesFromRedis,
        ...recipesToInsert,
        [page.toString()]: { hits: data.hits, next: data._links.next.href },
      });

      return extractRecipesFromObject(data.hits);
    },
  ),
  getRecipe: authWrapper(async (_: any, args: { id: string }, __: any) => {
    const { id } = args;
    const recipeFromRedis = await getValue(`recipe-${id}`);
    if (recipeFromRedis) {
      return recipeFromRedis;
    }
    const response = await axios.get(urlSingle, { params: { uri: `${uri}${id}` } });
    const data = response.data;
    if (data.hits.length < 1) {
      throw new GraphQLError('Recipe with provide id does not exist', {
        extensions: {
          code: 'NOT_FOUND',
        },
      });
    }
    const recipeFromResponse = data.hits[0].recipe;
    await setValue(`recipe-${recipeFromResponse.url}`, recipeFromResponse);
    return recipeFromResponse;
  }),
  reviewRecipe: authWrapper(
    async (
      _: any,
      args: { id: string; review: string; rating: number },
      { user }: { user: IUserType },
    ) => {
      const { id, review, rating } = args;
      const recipeFromRedis = await getValue(`recipe-${id}`);
      if (!recipeFromRedis) {
        const response = await axios.get(`urlSingle`, { params: { uri: `${uri}${id}` } });
        const data = response.data;
        if (data.hits.length < 1) {
          throw new GraphQLError('Recipe with provide id does not exist', {
            extensions: {
              code: 'NOT_FOUND',
            },
          });
        } else {
          const recipeFromResponse = data.hits[0].recipe;
          await setValue(`recipe-${recipeFromResponse.url}`, recipeFromResponse);
        }
      }

      await RecipeReview.create({ recipeId: id, userId: user._id, review, rating });

      return true;
    },
  ),
  removeReviewFromRecipe: authWrapper(
    async (_: any, args: { id: string }, { user }: { user: IUserType }) => {
      const { id: reviewId } = args;

      const review = await RecipeReview.findOne({ _id: reviewId, userId: user._id });

      if (!review) {
        throw new GraphQLError('Recipe with provide id does not exist', {
          extensions: {
            code: 'NOT_FOUND',
          },
        });
      }

      await review.deleteOne();

      return true;
    },
  ),
};

export default recipeResolver;

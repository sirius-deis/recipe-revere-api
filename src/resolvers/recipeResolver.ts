import { GraphQLError } from 'graphql';
import axios from 'axios';
import authWrapper from '../utils/auth.js';
import { setValue, getValue } from '../db/redisConnection.js';

const { EDAMAM_APPLICATION_ID, EDAMAM_APPLICATION_KEY } = process.env;

const url = `https://api.edamam.com/api/recipes/v2?type=public&app_id=${EDAMAM_APPLICATION_ID}&app_key=${EDAMAM_APPLICATION_KEY}`;
const urlSingle = `https://api.edamam.com/api/recipes/v2/by-uri?type=public&app_id=${EDAMAM_APPLICATION_ID}&app_key=${EDAMAM_APPLICATION_KEY}`;
const uri = 'http://www.edamam.com/ontologies/edamam.owl#recipe_';

const recipeResolver = {
  getRecipes: authWrapper(
    async (_: any, args: { query: string; page: number; size: number }, __: any) => {
      const { query, page = 1, size = 10 } = args;
      const from = size * (page - 1);
      const response = await axios.get(url, { params: { q: query } });

      return {};
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
    const recipeFromResponse = data.hits[0].recipe;
    await setValue(`recipe-${recipeFromResponse.url}`, recipeFromResponse, { EX: 60 * 60 * 24 });
    return recipeFromResponse;
  }),
};

export default recipeResolver;

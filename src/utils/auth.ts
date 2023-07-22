import { GraphQLError } from 'graphql';

const authWrapper = (fn: (parent: any, args: any, context: any) => Promise<any>) => {
  return async (parent: any, args: any, context: any) => {
    if (!context.user) {
      throw new GraphQLError('Token verification failed', {
        extensions: {
          code: 'TOKEN_VERIFICATION_FAILED',
          http: { status: 401 },
        },
      });
    }
    return await fn(parent, args, context);
  };
};

export default authWrapper;

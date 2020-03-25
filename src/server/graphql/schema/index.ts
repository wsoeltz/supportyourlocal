import { GraphQLSchema } from 'graphql';
import RootQueryType from './rootQueryType';
import mutations from './rootMutation';

export default new GraphQLSchema({
  query: RootQueryType,
  mutation: mutations,
});

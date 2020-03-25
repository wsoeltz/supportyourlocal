import {
  GraphQLObjectType,
} from 'graphql';

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: () => ({
  }),
});

export default RootQuery;

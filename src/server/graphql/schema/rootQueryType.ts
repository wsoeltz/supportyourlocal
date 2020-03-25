import {
  GraphQLObjectType,
} from 'graphql';

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  // fields: () => ({
  //   businesses: {
  //     type: new GraphQLList(BusinessType),
  //     resolve() {
  //       return Mountain.find({});
  //     },
  //   },
  // }),
});

export default RootQuery;

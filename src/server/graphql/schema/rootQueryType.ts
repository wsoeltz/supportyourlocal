import {
  GraphQLObjectType,
  GraphQLList,
} from 'graphql';
import BusinessType, { Business } from './queryTypes/businessType';


const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: () => ({
    businesses: {
      type: new GraphQLList(BusinessType),
      resolve() {
        return Business.find({});
      },
    },
  }),
});

export default RootQuery;

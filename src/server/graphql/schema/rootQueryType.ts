import {
  GraphQLFloat,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
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
    searchBusinesses: {
      type: new GraphQLList(BusinessType),
      args: {
        minLat: { type: GraphQLNonNull(GraphQLFloat) },
        maxLat: { type: GraphQLNonNull(GraphQLFloat) },
        minLong: { type: GraphQLNonNull(GraphQLFloat) },
        maxLong: { type: GraphQLNonNull(GraphQLFloat) },
      },
      resolve(parentValue, { minLat, maxLat, minLong, maxLong }:
        {minLat: number, maxLat: number, minLong: number, maxLong: number}) {
        return Business.find({
          latitude: { $gt: minLat, $lt: maxLat },
          longitude: { $gt: minLong, $lt: maxLong },
        });
      },
    },
  }),
});

export default RootQuery;

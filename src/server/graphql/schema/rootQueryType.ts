import {
  GraphQLFloat,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import BusinessType, { Business } from './queryTypes/businessType';
import {getDistanceFromLatLonInMiles} from '../../Utils';

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
        searchQuery: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve(parentValue, { minLat, maxLat, minLong, maxLong, searchQuery }:
        {minLat: number, maxLat: number, minLong: number, maxLong: number, searchQuery: string}) {
        const range = getDistanceFromLatLonInMiles({
          lat1: maxLat,
          lon1: minLong,
          lat2: minLat,
          lon2: maxLong,
        });
        if (range > 500) {
          return [];
        }
        return Business.find({
          name: { $regex: searchQuery, $options: 'i' },
          latitude: { $gt: minLat, $lt: maxLat },
          longitude: { $gt: minLong, $lt: maxLong },
        });
      },
    },
  }),
});

export default RootQuery;

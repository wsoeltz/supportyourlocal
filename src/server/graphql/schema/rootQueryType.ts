import {
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import {getDistanceFromLatLonInMiles} from '../../Utils';
import BusinessType, { Business } from './queryTypes/businessType';

interface SearchInput {
  minLat: number;
  maxLat: number;
  minLong: number;
  maxLong: number;
  searchQuery: string;
  nPerPage: number | null;
  pageNumber: number | null;
}

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: () => ({
    businesses: {
      type: new GraphQLList(BusinessType),
      resolve() {
        return Business.find({});
      },
    },
    business: {
      type: BusinessType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve(parentValue, { id }) {
        return Business.findById(id);
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
        nPerPage: { type: GraphQLInt },
        pageNumber: { type: GraphQLInt },
      },
      resolve(parentValue, { minLat, maxLat, minLong, maxLong, searchQuery, nPerPage, pageNumber}:
        SearchInput) {
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
        })
        .limit(nPerPage ? nPerPage : 0)
        .skip(  pageNumber && nPerPage && pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0 );
      },
    },
  }),
});

export default RootQuery;

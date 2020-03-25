import {
  GraphQLList,
  GraphQLString,
  GraphQLFloat,
  GraphQLNonNull,
  GraphQLID,
} from 'graphql';
import BusinessType, { Business } from '../queryTypes/businessType';
import { Business as IBusiness } from '../../graphQLTypes';

const businessMutations: any = {
  addBusiness: {
    type: BusinessType,
    args: {
      externalId: { type: GraphQLString },
      source: { type: GraphQLString },
      name: { type: GraphQLNonNull(GraphQLString) },
      address: { type: GraphQLNonNull(GraphQLString) },
      city: { type: GraphQLNonNull(GraphQLString) },
      country: { type: GraphQLNonNull(GraphQLString) },
      email: { type: GraphQLNonNull(GraphQLString) },
      website: { type: GraphQLString },
      secondaryUrl: { type: GraphQLString },
      logo: { type: GraphQLString },
      images: { type: new GraphQLList(GraphQLString) },
      latitude: { type: GraphQLNonNull(GraphQLFloat) },
      longitude: { type: GraphQLNonNull(GraphQLFloat) },
    },
    resolve(_unused: any, input: IBusiness) {
      return new Business(input).save();
    },
  },
  deleteBusiness: {
    type: BusinessType,
    args: {
      id: { type: GraphQLNonNull(GraphQLID) },
    },
    resolve(_unused: any, { id }: { id: string }) {
      return Business.findByIdAndDelete(id);
    },
  },
  updateBusiness: {
    type: BusinessType,
    args: {
      id: { type: GraphQLNonNull(GraphQLID) },
      externalId: { type: GraphQLString },
      source: { type: GraphQLString },
      name: { type: GraphQLNonNull(GraphQLString) },
      address: { type: GraphQLNonNull(GraphQLString) },
      city: { type: GraphQLNonNull(GraphQLString) },
      country: { type: GraphQLNonNull(GraphQLString) },
      email: { type: GraphQLNonNull(GraphQLString) },
      website: { type: GraphQLString },
      secondaryUrl: { type: GraphQLString },
      logo: { type: GraphQLString },
      images: { type: new GraphQLList(GraphQLString) },
      latitude: { type: GraphQLNonNull(GraphQLFloat) },
      longitude: { type: GraphQLNonNull(GraphQLFloat) },
    },
    async resolve(_unused: any, input: IBusiness) {
      try {
        const {id, ...fields} = input;
        const newBusiness = await Business.findOneAndUpdate({
            _id: id,
          },
          { ...fields },
          {new: true});
        return newBusiness;
      } catch (err) {
        return err;
      }
    },
  },
  
}

export default businessMutations;

/* tslint:disable:await-promise */
import {
  GraphQLFloat,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import { Business as IBusiness } from '../../graphQLTypes';
import BusinessType, { Business } from '../queryTypes/businessType';

const businessMutations: any = {
  addBusiness: {
    type: BusinessType,
    args: {
      externalId: { type: GraphQLString },
      source: { type: GraphQLString },
      name: { type: GraphQLNonNull(GraphQLString) },
      address: { type: GraphQLNonNull(GraphQLString) },
      city: { type: GraphQLString },
      country: { type: GraphQLNonNull(GraphQLString) },
      email: { type: GraphQLString },
      website: { type: GraphQLString },
      secondaryUrl: { type: GraphQLString },
      logo: { type: GraphQLString },
      images: { type: new GraphQLList(GraphQLString) },
      industry: { type: GraphQLString },
      description: { type: GraphQLString },
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
      city: { type: GraphQLString },
      country: { type: GraphQLNonNull(GraphQLString) },
      email: { type: GraphQLString },
      website: { type: GraphQLString },
      secondaryUrl: { type: GraphQLString },
      logo: { type: GraphQLString },
      images: { type: new GraphQLList(GraphQLString) },
      industry: { type: GraphQLString },
      description: { type: GraphQLString },
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
  updateExternalIdBusiness: {
    type: BusinessType,
    args: {
      externalId: { type: GraphQLString },
      source: { type: GraphQLString },
      name: { type: GraphQLNonNull(GraphQLString) },
      address: { type: GraphQLNonNull(GraphQLString) },
      city: { type: GraphQLString },
      country: { type: GraphQLNonNull(GraphQLString) },
      email: { type: GraphQLString },
      website: { type: GraphQLString },
      secondaryUrl: { type: GraphQLString },
      logo: { type: GraphQLString },
      images: { type: new GraphQLList(GraphQLString) },
      industry: { type: GraphQLString },
      description: { type: GraphQLString },
      latitude: { type: GraphQLNonNull(GraphQLFloat) },
      longitude: { type: GraphQLNonNull(GraphQLFloat) },
    },
    async resolve(_unused: any, input: IBusiness) {
      try {
        const {externalId, source} = input;
        const newBusiness = await Business.findOneAndUpdate({
            externalId, source,
          },
          { ...input },
          {new: true});
        return newBusiness;
      } catch (err) {
        return err;
      }
    },
  },
  updateClickHistory: {
    type: BusinessType,
    args: {
      id: { type: GraphQLNonNull(GraphQLID) },
    },
    async resolve(_unused: any, {id}: {id: string}) {
      try {
        const business = await Business.findOne({ _id: id });
        if (business) {
          const clickCount = business.clickCount ? business.clickCount + 1 : 1;
          const mostRecentClick = new Date();
          const newBusiness = await Business.findOneAndUpdate({ _id: id },
            { mostRecentClick, clickCount },
            {new: true});
          return newBusiness;
        } else {
          return null;
        }
      } catch (err) {
        return err;
      }
    },
  },

};

export default businessMutations;

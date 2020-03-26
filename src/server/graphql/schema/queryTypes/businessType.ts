import {
  GraphQLFloat,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import mongoose, { Schema } from 'mongoose';
import { Business as IBusiness } from '../../graphQLTypes';

type BusinessSchemaType = mongoose.Document & IBusiness;

export type BusinessModelType = mongoose.Model<BusinessSchemaType> & BusinessSchemaType;

const BusinessSchema = new Schema({
  externalId: { type: String },
  source: { type: String },
  name: { type: String },
  address: { type: String },
  city: { type: String },
  country: { type: String },
  email: { type: String },
  website: { type: String },
  secondaryUrl: { type: String },
  logo: { type: String },
  images: [{ type: String }],
  latitude: { type: Number },
  longitude: { type: Number },
});

export const Business: BusinessModelType = mongoose.model<BusinessModelType, any>('Business', BusinessSchema);

const BusinessType: any = new GraphQLObjectType({
  name:  'BusinessType',
  fields: () => ({
    id: { type: GraphQLID },
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
  }),
});

export default BusinessType;

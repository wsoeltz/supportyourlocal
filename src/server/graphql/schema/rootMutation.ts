import {
  GraphQLObjectType,
} from 'graphql';
import mongoose from 'mongoose';
import businessMutations from './mutations/businessMutations';

mongoose.set('useFindAndModify', false);

const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    ...businessMutations,
  },
});

export default mutation;

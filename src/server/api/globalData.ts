import { Business } from '../graphql/schema/queryTypes/businessType';

export default async () => {
  const businesses = await (Business as any).find({});
  return { totalBusinesses: businesses.length };
};

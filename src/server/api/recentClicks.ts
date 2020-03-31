import { Business } from '../graphql/schema/queryTypes/businessType';

export default async ({limit}: {limit: number}) => {
  const businesses = await (Business as any)
    .find({mostRecentClick: { $exists: true, $ne: null } })
    .limit(limit)
    .sort({mostRecentClick: -1});
  return businesses;
};

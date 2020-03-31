import { Business } from '../graphql/schema/queryTypes/businessType';
import { GeoLocation } from '../Utils';

interface Input {
  limit: number;
  lat?: number;
  lng?: number;
  range?: number;
}

export default async (input: Input) => {
  const {
    limit, lat, lng, range,
  } = input;
  let filter: object = {mostRecentClick: { $exists: true, $ne: null }};
  if (lat && lng && range) {
    const coordinates = GeoLocation.buildLocationRange(lat, lng, GeoLocation.kmToMile(range));
    if (coordinates) {
      const { minLat, minLon, maxLat, maxLon } = coordinates;
      filter = {
        mostRecentClick: { $exists: true, $ne: null },
        latitude: { $gt: minLat, $lt: maxLat },
        longitude: { $gt: minLon, $lt: maxLon },
      };
    }
  }
  const businesses = await (Business as any)
    .find({...filter})
    .limit(limit)
    .sort({clickCount: -1});
  return businesses;
};

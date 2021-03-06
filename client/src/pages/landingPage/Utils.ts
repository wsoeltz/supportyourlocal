import {CustomGeoJson, GeoJsonFeature} from '../../components/map';
import {Business} from '../../graphQLTypes';

interface Datum {
  id: Business['id'];
  name: Business['name'];
  address: Business['address'];
  latitude: Business['latitude'];
  longitude: Business['longitude'];
}

export const transformAllData = (data: Datum[]): CustomGeoJson => {
  const features: GeoJsonFeature[] = data.map(datum => {
    return {
      type: 'Feature',
      properties: {
        title: datum.name,
        address: datum.address,
        gqlId: datum.id,
      },
      geometry: {
        coordinates: [datum.longitude, datum.latitude],
        type: 'Point',
      },
    };
  });
  return { features };
};

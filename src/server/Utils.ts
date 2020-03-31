/* distance formula from
https://stackoverflow.com/
questions/18883601/function-to-calculate-distance-between-two-coordinates
*/
interface DistanceInput {
  lat1: number;
  lon1: number;
  lat2: number;
  lon2: number;
}

const deg2rad = (deg: number) => deg * (Math.PI / 180);

const getDistanceFromLatLonInKm = ({lat1, lon1, lat2, lon2}: DistanceInput) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);  // deg2rad below
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

export const getDistanceFromLatLonInMiles = (input: DistanceInput) =>
  getDistanceFromLatLonInKm(input) * 0.62137;

//Javascript for finding latitude and longitude range boundaries.
//Based on the excellent Java example by http://janmatuschek.de/LatitudeLongitudeBoundingCoordinates
interface LocationDatum {
  degLat: number;
  degLon: number;
  radLat: number;
  radLon: number;
}

export const GeoLocation = {
  TO_RADIAN: 0.0174532925,
  TO_DEGREE: 57.2957795,
  EARTH_RADIUS: 6371.01,
  TO_MILE: 0.621371192,
  TO_KM: 1.609344,
  MIN_LAT() { return GeoLocation.degreeToRadian(-90); },
  MAX_LAT() { return GeoLocation.degreeToRadian(90); },
  MIN_LON() { return GeoLocation.degreeToRadian(-180); },
  MAX_LON() { return GeoLocation.degreeToRadian(180); },

  degreeToRadian(degree: number) { return degree * GeoLocation.TO_RADIAN; },
  radianToDegree(radian: number) { return radian * GeoLocation.TO_DEGREE; },
  kmToMile(km: number) {return km * GeoLocation.TO_MILE; },
  mileToKm(mile: number) {return mile * GeoLocation.TO_KM; },

  buildLocationRange(latitude: number, longitude: number, boundaryInMiles: number) {
    const degLat = latitude;
    const degLon = longitude;
    const radLat = GeoLocation.degreeToRadian(degLat);
    const radLon = GeoLocation.degreeToRadian(degLon);

    const location = {  degLat
                    , degLon
                    , radLat
                    , radLon,
                   };

    GeoLocation.checkBounds(location);
    const locationRange = GeoLocation.boundingCoordinates(location, GeoLocation.mileToKm(boundaryInMiles));

    return locationRange;
  },

  checkBounds(location: LocationDatum) {
    if (location.radLat < GeoLocation.MIN_LAT() || location.radLat > GeoLocation.MAX_LAT() ||
        location.radLon < GeoLocation.MIN_LON() || location.radLon > GeoLocation.MAX_LON()) {
          console.error('radLat or radLon is out of bounds');
    }
  },

  distance(location1: LocationDatum, location2: LocationDatum) {
    return Math.acos(Math.sin(location1.radLat) * Math.sin(location2.radLat) +
        Math.cos(location1.radLat) * Math.cos(location2.radLat) *
        Math.cos(location1.radLon - location2.radLon)) * GeoLocation.EARTH_RADIUS;
  },

  boundingCoordinates(location: LocationDatum, distance: number) {
    if (!location || distance < 0) {
      console.error('no location or distance');
      return;
    }

    const radius = GeoLocation.EARTH_RADIUS;
    const radDist = distance / radius;
    let minLat = location.radLat - radDist;
    let maxLat = location.radLat + radDist;

    let minLon, maxLon;

    if (minLat > GeoLocation.MIN_LAT() && maxLat < GeoLocation.MAX_LAT()) {
      const deltaLon = Math.asin(Math.sin(radDist) / Math.cos(location.radLat));
      minLon = location.radLon - deltaLon;
      if (minLon < GeoLocation.MIN_LON()) { minLon += 2 * Math.PI; }
      maxLon = location.radLon + deltaLon;
      if (maxLon > GeoLocation.MAX_LON()) { maxLon -= 2 * Math.PI; }
    } else {
      // a pole is within the distance
      minLat = Math.max(minLat, GeoLocation.MIN_LAT());
      maxLat = Math.min(maxLat, GeoLocation.MAX_LAT());
      minLon = GeoLocation.MIN_LON();
      maxLon = GeoLocation.MAX_LON();
    }

    const locationRange = {  lat: location.degLat
                      , lon: location.degLon
                      , minLat: GeoLocation.radianToDegree(minLat)
                      , maxLat: GeoLocation.radianToDegree(maxLat)
                      , minLon: GeoLocation.radianToDegree(minLon)
                      , maxLon: GeoLocation.radianToDegree(maxLon),
                     };
    return locationRange;
  },

};

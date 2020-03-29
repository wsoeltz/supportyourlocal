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

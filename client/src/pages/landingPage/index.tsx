import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import isEqual from 'lodash/isEqual';
import React, {useState} from 'react';
import Map, {MapBounds} from '../../components/map';
import {
  Business,
} from '../../graphQLTypes';
import { Content } from '../../styling/Grid';

const SEARCH_BUSINESSES = gql`
  query ListBusinesses(
    $minLat: Float!,
    $maxLat: Float!,
    $minLong: Float!,
    $maxLong: Float!,
  ) {
    businesses: searchBusinesses(
      minLat: $minLat,
      maxLat: $maxLat,
      minLong: $minLong,
      maxLong: $maxLong,
    ) {
      id
      externalId
      source
      name
      address
      city
      country
      email
      website
      secondaryUrl
      logo
      images
      latitude
      longitude
    }
  }
`;

interface SearchVariables extends MapBounds {
  searchTerm?: string;
}

interface SuccessResponse {
  businesses: Business[];
}

const LandingPage = () => {

  const initialMapBounds = {
    minLong: 12.4, maxLong: 14.4, minLat: 51.4874445, maxLat: 53.4874445,
  };
  const initialCenter: [number, number] = [
    (initialMapBounds.maxLong + initialMapBounds.minLong) / 2,
    (initialMapBounds.maxLat + initialMapBounds.minLat) / 2,
  ];

  const [mapBounds, setMapBounds] = useState<MapBounds>({...initialMapBounds});

  const getMapBounds = (newMapBounds: MapBounds) => {
    if (
      !(isEqual(newMapBounds, mapBounds)) && (
        // map is zoomed in within the bounds of the previous bounds, so no need to update
        (mapBounds.maxLat < newMapBounds.maxLat) ||
        (mapBounds.maxLong < newMapBounds.maxLong) ||
        (mapBounds.minLat > newMapBounds.minLat) ||
        (mapBounds.minLong > newMapBounds.minLong)
      )
    ) {
      setMapBounds({...newMapBounds});
    }
  };
  const {loading, error, data} = useQuery<SuccessResponse, SearchVariables>(SEARCH_BUSINESSES, {
    variables: {...mapBounds},
  });

  let coordinates: Business[];
  if (loading) {
    coordinates = [];
  } else if (error !== undefined) {
    console.error(error);
    coordinates = [];
  } else if (data !== undefined) {
    const { businesses } = data;
    coordinates = [...businesses];
  } else {
    coordinates = [];
  }

  return (
    <Content>
      <Map
        coordinates={coordinates}
        getMapBounds={getMapBounds}
        mapBounds={mapBounds}
        initialCenter={initialCenter}
        key={'main-map'}
      />
    </Content>
  );

};

export default LandingPage;

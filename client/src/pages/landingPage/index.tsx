import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';
import React, {useState} from 'react';
import styled from 'styled-components/macro';
import Map, {MapBounds} from '../../components/map';
import SearchPanel from '../../components/searchPanel';
import {
  Business,
} from '../../graphQLTypes';
import { Content } from '../../styling/Grid';

const Root = styled(Content)`
  display: grid;
  height: 100%;
  overflow: hidden;
  grid-template-columns: 500px 1fr;
`;

const SEARCH_BUSINESSES = gql`
  query ListBusinesses(
    $minLat: Float!,
    $maxLat: Float!,
    $minLong: Float!,
    $maxLong: Float!,
    $searchQuery: String!,
  ) {
    businesses: searchBusinesses(
      minLat: $minLat,
      maxLat: $maxLat,
      minLong: $minLong,
      maxLong: $maxLong,
      searchQuery: $searchQuery,
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
  searchQuery: string;
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [highlighted, setHighlighted] = useState<[Business] | undefined>(undefined);

  const getMapBounds = (newMapBounds: MapBounds) => {
    if (!(isEqual(newMapBounds, mapBounds))) {
      setMapBounds({...newMapBounds});
    }
  };
  const {loading, error, data} = useQuery<SuccessResponse, SearchVariables>(SEARCH_BUSINESSES, {
    variables: {...mapBounds, searchQuery},
  });

  let coordinates: Business[];
  if (loading) {
    coordinates = [];
  } else if (error !== undefined) {
    console.error(error);
    coordinates = [];
  } else if (data !== undefined) {
    const { businesses } = data;
    coordinates = sortBy(businesses, ['name']);
  } else {
    coordinates = [];
  }

  return (
    <Root>
      <SearchPanel
        data={coordinates}
        setSearchQuery={setSearchQuery}
        loading={loading}
        setHighlighted={setHighlighted}
      />
      <Map
        coordinates={coordinates}
        getMapBounds={getMapBounds}
        mapBounds={mapBounds}
        initialCenter={initialCenter}
        highlighted={highlighted}
        key={'main-map'}
      />
    </Root>
  );

};

export default LandingPage;

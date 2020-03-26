import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import React from 'react';
import Map from '../../components/map';
import {
  Business,
} from '../../graphQLTypes';
import { Content } from '../../styling/Grid';

const GET_ALL_BUSINESSES = gql`
  query ListBusinesses {
    businesses {
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

interface SuccessResponse {
  businesses: Business[];
}

const LandingPage = () => {
  const {loading, error, data} = useQuery<SuccessResponse>(GET_ALL_BUSINESSES);

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
      />
    </Content>
  );

};

export default LandingPage;

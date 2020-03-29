import { useQuery } from '@apollo/react-hooks';
import {
  faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GetString } from 'fluent-react/compat';
import gql from 'graphql-tag';
import {darken} from 'polished';
import React, {useContext, useState} from 'react';
import styled from 'styled-components/macro';
import {
  AppLocalizationAndBundleContext,
} from '../../contextProviders/getFluentLocalizationContext';
import { Business } from '../../graphQLTypes';
import usePrevious from '../../hooks/usePrevious';
import { lightBorderColor } from '../../styling/styleUtils';
import {Coordinate, MapBounds} from '../map';

export const mobileWidth = 600;

const Root = styled.div`
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-rows: 1fr;
  position: relative;
  z-index: 10;

  @media (max-width: ${mobileWidth}px) {
    min-height: 120px;
  }
`;

const ScrollContainer = styled.div`
  padding: 0 1rem;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;

  @media (max-width: ${mobileWidth}px) {
    display: flex;
    width: 100%;
  }

  ::-webkit-scrollbar {
    -webkit-appearance: none;
    width: 8px;
    height: 12px;
  }
  ::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background-color: rgba(0, 0, 0, .3);
  }
  ::-webkit-scrollbar-track {
    background-color: rgba(0, 0, 0, .1);
  }
`;

const Card = styled.div`
  box-sizing: border-box;
  padding: 0.8rem 0 1.3rem;
  border-bottom: solid 1px ${lightBorderColor};
  position: relative;

  @media (max-width: ${mobileWidth}px) {
    flex-shrink: 0;
    font-size: 0.9rem;
    padding: 0 0.8rem;
    display: flex;
    flex-direction: column;
    border-bottom: none;
    border-right: solid 1px ${lightBorderColor};
  }
`;

const TitleContainer = styled.div`
  display: grid;
  grid-column-gap: 0.5rem;
  padding-right: 1rem;
`;

const Title = styled.h4`
  font-size: 1rem;
  margin-top: 0;
  margin-bottom: 0.5rem;
`;

const Info = styled.p`
  font-size: 0.9rem;
  color: #666;
`;

const LinkContainer = styled.div`
`;

const LinkButton = styled.a`
  padding: 0.3rem 0.4rem;
  background-color: #b2b2b2;
  color: #fff;
  text-decoration: none;
  text-transform: capitalize;
  text-align: center;
  font-size: 0.75rem;
  border-radius: 5px;

  &:hover {
    background-color: ${darken(0.1, '#b2b2b2')};
  }

  &:not(:last-child) {
    margin-right: 0.6rem;
  }
`;

const NoResults = styled.p`
  padding: 1rem;
  text-align: center;
  color: #666;
`;

const ShowOnMap = styled.button`
  position: absolute;
  top: 0.5rem;
  right: -0.4rem;
  background-color: transparent;
  color: #215890;
  font-size: 1rem;

  @media (max-width: ${mobileWidth}px) {
    top: 0;
    right: 0;
  }
`;

const SEARCH_BUSINESSES = gql`
  query ListBusinesses(
    $minLat: Float!,
    $maxLat: Float!,
    $minLong: Float!,
    $maxLong: Float!,
    $searchQuery: String!,
    $nPerPage: Int!,
    $pageNumber: Int!,
  ) {
    businesses: searchBusinesses(
      minLat: $minLat,
      maxLat: $maxLat,
      minLong: $minLong,
      maxLong: $maxLong,
      searchQuery: $searchQuery,
      nPerPage: $nPerPage,
      pageNumber: $pageNumber,
    ) {
      id
      name
      address
      website
      secondaryUrl
      industry
      latitude
      longitude
    }
  }
`;

interface SearchVariables extends MapBounds {
  searchQuery: string;
  pageNumber: number;
  nPerPage: number;
}

interface SuccessResponse {
  businesses: Array<{
    id: Business['id'];
    name: Business['name'];
    address: Business['address'];
    website: Business['website'];
    secondaryUrl: Business['secondaryUrl'];
    industry: Business['industry'];
    latitude: Business['latitude'];
    longitude: Business['longitude'];
  }>;
}

interface Props {
  setHighlighted: (value: [Coordinate]) => void;
  mapBounds: MapBounds;
  searchQuery: string;
}

const SearchPanel = (props: Props) => {
  const {setHighlighted, mapBounds, searchQuery} = props;

  const {localization} = useContext(AppLocalizationAndBundleContext);
  const getFluentString: GetString = (...args) => localization.getString(...args);

  const [pageNumber] = useState<number>(1);
  const nPerPage = 25;

  const {loading, error, data} = useQuery<SuccessResponse, SearchVariables>(SEARCH_BUSINESSES, {
    variables: {...mapBounds, searchQuery, nPerPage, pageNumber},
  });

  const prevData = usePrevious(data);

  const dataToUse = loading === true ? prevData : data;

  let content: React.ReactElement<any> | null;
  if (error) {
    console.error(error);
    content = (
      <NoResults>
        <em>{getFluentString('ui-text-there-was-an-error')}</em>
      </NoResults>
    );
  } else if (!dataToUse || !dataToUse.businesses || dataToUse.businesses.length === 0) {
    content = (
      <NoResults>
        <em>{getFluentString('ui-text-no-results-for-location')}</em>
      </NoResults>
    );
  } else {
    const cards = dataToUse.businesses.map(d => {
      const {
        name, address, website,
        secondaryUrl, industry,
      } = d;
      const websiteLink = website
        ? (
            <LinkButton
              href={website}
              target='_blank'
              rel='noopener noreferrer'
            >
              {getFluentString('ui-text-view-website')}
            </LinkButton>
          )
        : null;
      let secondaryLink: React.ReactElement<any> | null;
      if (secondaryUrl) {
        secondaryLink = (
              <LinkButton
            href={secondaryUrl}
            target='_blank'
            rel='noopener noreferrer'
          >
            {getFluentString('ui-text-visit-voucher-shop')}
          </LinkButton>
        );
      } else {
        secondaryLink = null;
      }
      return (
        <Card key={d.id}>
          <TitleContainer>
            <Title>{name}</Title>
            <Info>
              {industry}
              <br />
              {address}
            </Info>
          </TitleContainer>
          <LinkContainer>
            {secondaryLink}
            {websiteLink}
          </LinkContainer>
          <ShowOnMap onClick={() => setHighlighted([d])}>
            <FontAwesomeIcon icon={faMapMarkerAlt} />
          </ShowOnMap>
        </Card>
      );
    });
    content = <ScrollContainer>{cards}</ScrollContainer>;
  }

  return (
    <Root>
      {content}
    </Root>
  );
};

export default SearchPanel;

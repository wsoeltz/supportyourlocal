import { useQuery } from '@apollo/react-hooks';
import {
  faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GetString } from 'fluent-react/compat';
import gql from 'graphql-tag';
import React, {useContext, useEffect, useRef, useState} from 'react';
import styled from 'styled-components/macro';
import {
  AppLocalizationAndBundleContext,
} from '../../contextProviders/getFluentLocalizationContext';
import { Business } from '../../graphQLTypes';
import usePrevious from '../../hooks/usePrevious';
import { lightBorderColor, LinkButton, primaryColor, secondaryColor } from '../../styling/styleUtils';
import {getDistanceFromLatLonInMiles} from '../../Utils';
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
  color: #001240;
`;

const Info = styled.p`
  font-size: 0.9rem;
  color: #435369;
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
  color: ${primaryColor};
  font-size: 1rem;

  @media (max-width: ${mobileWidth}px) {
    top: 0;
    right: 0;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 2rem 0;

  @media (max-width: ${mobileWidth}px) {
    padding: 1rem;
    margin: 0;
    flex-direction: column-reverse;
    align-items: center;
  }
`;

const PageButtonBase = styled.button`
  padding: 0.3rem 0.4rem;
  background-color: ${secondaryColor};
  border: solid 2px ${secondaryColor};
  color: ${primaryColor};
  text-decoration: none;
  text-transform: uppercase;
  text-align: center;
  font-size: 0.75rem;
  border-radius: 5px;

  &:hover {
    background-color: transparent;
  }

  @media (max-width: ${mobileWidth}px) {
    white-space: nowrap;
    width: 100%;
    height: 2rem;
  }
`;

const NextButton = styled(PageButtonBase)`
  margin-left: auto;
`;

const PreviousButton = styled(PageButtonBase)`
  margin-right: auto;
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

  const [pageNumber, setPageNumber] = useState<number>(1);
  const nPerPage = 25;

  const incPage = () => setPageNumber(pageNumber + 1);
  const decPage = () => setPageNumber(pageNumber > 0 ? pageNumber - 1 : 0);

  const {loading, error, data} = useQuery<SuccessResponse, SearchVariables>(SEARCH_BUSINESSES, {
    variables: {...mapBounds, searchQuery, nPerPage, pageNumber},
  });

  useEffect(() => {
    setPageNumber(0);
  }, [mapBounds, searchQuery, setPageNumber]);

  const resultsContainerElm = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = resultsContainerElm.current;
    if (node) {
      node.scrollTop = 0;
    }
  }, [resultsContainerElm, pageNumber]);

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
    const range = getDistanceFromLatLonInMiles({
      lat1: mapBounds.maxLat,
      lon1: mapBounds.minLong,
      lat2: mapBounds.minLat,
      lon2: mapBounds.maxLong,
    });
    const noResultsFluentId = range > 500
      ? 'ui-text-out-out-range' : 'ui-text-no-results-for-location';
    content = (
      <NoResults>
        <em>{getFluentString(noResultsFluentId)}</em>
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
          <div>
            {secondaryLink}
            {websiteLink}
          </div>
          <ShowOnMap onClick={() => setHighlighted([d])}>
            <FontAwesomeIcon icon={faMapMarkerAlt} />
          </ShowOnMap>
        </Card>
      );
    });

    const nextButton = dataToUse.businesses.length === nPerPage ? (
      <NextButton onClick={incPage}>Next ›</NextButton>
    ) : null;
    const prevButton = pageNumber > 1 ? (
      <PreviousButton onClick={decPage}>‹ Previous</PreviousButton>
    ) : null;

    content = (
      <ScrollContainer ref={resultsContainerElm}>
        {cards}
        <PaginationContainer>
          {prevButton}
          {nextButton}
        </PaginationContainer>
      </ScrollContainer>
    );
  }

  return (
    <Root>
      {content}
    </Root>
  );
};

export default SearchPanel;

import { useMutation, useQuery } from '@apollo/react-hooks';
import {
  faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GetString } from 'fluent-react/compat';
import gql from 'graphql-tag';
import sortBy from 'lodash/sortBy';
import {rgba} from 'polished';
import React, {useContext, useEffect, useRef, useState} from 'react';
import styled from 'styled-components/macro';
import {AppContext} from '../../App';
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
  padding: 0.8rem 1rem 1.3rem;
  border-bottom: solid 1px ${lightBorderColor};
  position: relative;

  @media (max-width: ${mobileWidth}px) {
    flex-shrink: 0;
    font-size: 0.9rem;
    padding: 0.8rem;
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

const NoResults = styled.div`
  padding: 1rem;
  color: #666;
`;

const ShowOnMap = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0;
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
  margin: 2rem 1rem;

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

const Para = styled.p`
  padding: 0 0.8rem;
  margin: 0;
  font-size: 0.85rem;
  color: #666;
  text-align: left;

  a {
    color: ${primaryColor};
  }

  &:first-of-type {
    margin-top: 0.7rem;
  }

  &:last-of-type {
    margin-bottom: 0.7rem;
  }
`;

const SEARCH_BUSINESSES = gql`
  query SearchBusinesses($selectionArray: [ID!]) {
    businesses: getBusinessesFromArray(selectionArray: $selectionArray) {
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

interface SearchVariables {
  selectionArray: string[];
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

const UPDATE_CLICK_HISTORY = gql`
  mutation UpdateClickHisory($id: ID!) {
    business: updateClickHistory (id: $id) {
      id
    }
  }
`;

interface ClickHistorySuccess {
  business: {
    id: Business['id'];
  };
}

interface ClickHistoryVariables {
  id: Business['id'];
}

interface Props {
  setHighlighted: (value: [Coordinate]) => void;
  mapBounds: MapBounds;
  coordinates: Coordinate[];
  highlighted: [Coordinate] | undefined;
  onLinkClick: (value: Coordinate & {name: string}) => void;
}

const SearchPanel = (props: Props) => {
  const {setHighlighted, mapBounds, coordinates, highlighted, onLinkClick} = props;

  const {localization} = useContext(AppLocalizationAndBundleContext);
  const getFluentString: GetString = (...args) => localization.getString(...args);

  const { windowWidth } = useContext(AppContext);

  const [pageNumber, setPageNumber] = useState<number>(1);
  const nPerPage = 25;

  const incPage = () => setPageNumber(pageNumber + 1);
  const decPage = () => setPageNumber(pageNumber > 0 ? pageNumber - 1 : 0);

  const trimmedCoordinates = coordinates.slice((pageNumber - 1) * nPerPage, nPerPage * pageNumber);

  const selectionArray = trimmedCoordinates.map(({id}) => id);

  const [updateClickHistory] = useMutation<ClickHistorySuccess, ClickHistoryVariables>(UPDATE_CLICK_HISTORY);
  const {loading, error, data} = useQuery<SuccessResponse, SearchVariables>(SEARCH_BUSINESSES, {
    variables: {selectionArray},
  });

  useEffect(() => {
    setPageNumber(1);
  }, [mapBounds, setPageNumber]);

  const resultsContainerElm = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = resultsContainerElm.current;
    if (node) {
      node.scrollTop = 0;
    }
  }, [resultsContainerElm, pageNumber]);

  const prevData = usePrevious(data);

  const dataToUse = loading === true ? prevData : data;

  const missingShopPara = (
    <Para
      dangerouslySetInnerHTML={{__html: getFluentString('search-text-missing-shop')}}
    />
  );

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
    const missingShopParaElm = range > 500
      ? null : (
        <Para
          dangerouslySetInnerHTML={{__html: getFluentString('search-text-no-results-donate')}}
        />
      );
    content = (
      <>
        <NoResults>
          <em>{getFluentString(noResultsFluentId)}</em>
        </NoResults>
        {missingShopParaElm}
      </>
    );
  } else {

    const currentCenter = [
      (mapBounds.maxLong + mapBounds.minLong) / 2,
      (mapBounds.maxLat + mapBounds.minLat) / 2,
    ];
    const sortedData = sortBy(dataToUse.businesses, (coord) => getDistanceFromLatLonInMiles({
      lat1: coord.latitude,
      lat2: currentCenter[1],
      lon1: coord.longitude,
      lon2: currentCenter[0],
    }));
    const cards = sortedData.map(d => {
      const {
        name, address, website,
        secondaryUrl, industry,
      } = d;
      const onClick = () => {
        onLinkClick(d);
        updateClickHistory({variables: {id: d.id}});
      };
      const websiteLink = website
        ? (
            <LinkButton
              onClick={onClick}
              href={website}
              target='_blank'
              rel='noopener noreferrer'
              data-clickout='website'
            >
              {getFluentString('ui-text-view-website')}
            </LinkButton>
          )
        : null;
      let secondaryLink: React.ReactElement<any> | null;
      if (secondaryUrl) {
        secondaryLink = (
          <LinkButton
            onClick={onClick}
            href={secondaryUrl}
            target='_blank'
            rel='noopener noreferrer'
            data-clickout='vouchershop'
          >
            {getFluentString('ui-text-visit-voucher-shop')}
          </LinkButton>
        );
      } else {
        secondaryLink = null;
      }
      const industryElm = industry && industry.length ? (
        <>
          {industry}
          <br />
        </>
      ) : null;
      const backgroundColor = highlighted && highlighted[0] && highlighted[0].id === d.id
        ? rgba(secondaryColor, 0.2) : undefined;
      return (
        <Card key={d.id} style={{backgroundColor}}>
          <TitleContainer>
            <Title>{name}</Title>
            <Info>
              {industryElm}
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

    const numberOfShops = coordinates.length && windowWidth > mobileWidth
      ? (
        <>
          <Para><strong>{coordinates.length}</strong> {getFluentString('ui-text-shops-found')}</Para>
          {missingShopPara}
        </>
      ) : null;

    content = (
      <ScrollContainer ref={resultsContainerElm}>
        {numberOfShops}
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

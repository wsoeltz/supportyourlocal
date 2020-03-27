import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';
import React, {useContext, useEffect, useState, useRef} from 'react';
import styled, {keyframes} from 'styled-components/macro';
import { AppContext } from '../../App';
import Map, {MapBounds} from '../../components/map';
import SearchPanel from '../../components/searchPanel';
import {
  Business,
} from '../../graphQLTypes';
import { Content } from '../../styling/Grid';
import StandardSearch from '../../components/searchPanel/StandardSearch';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapMarkerAlt,
  faStreetView,
} from '@fortawesome/free-solid-svg-icons';
import {lighten} from 'polished';

const primaryBackgroundColor = '#f3f3f3';
const primaryColor = '#215890';

const Root = styled(Content)`
  display: grid;
  height: 100%;
  overflow: hidden;
  grid-template-rows: 70px 1fr 70px;
`;

const GeoCoderSearchContainer = styled.div`
  background-color: #e2e2e2;
  padding: 1rem 1rem;
  display: grid;
  grid-template-columns: 1fr 2.5rem;
`;

const spinAnimation = keyframes`
  from {
      transform:rotate(0deg);
  }
  to {
      transform:rotate(360deg);
  }
`;

const GeoCoderSearch = styled.div`
  position: relative;
  min-height: 2.5625rem;
  border: solid 1px #dcdcdc;
  box-shadow: 0px 0px 3px -1px #b5b5b5;
  box-sizing: border-box;
  background-color: #fff;
  position: relative;
  z-index: 100;

  input.mapboxgl-ctrl-geocoder--input {
    padding: 8px 8px 8px 2.5rem;
    border: none;
    box-sizing: border-box;
    width: 100%;
    font-size: 1.2rem;
    font-weight: 300;

    &::placeholder {
      color: #999;
    }
  }

  .mapboxgl-ctrl-geocoder--icon-search {
    display: none;
  }

  .mapboxgl-ctrl-geocoder--pin-right {
    position: absolute;
    right: 4px;
    top: 2px;
    height: 2.5rem;
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
  }

  .mapboxgl-ctrl-geocoder--icon-loading,
  .mapboxgl-ctrl-geocoder--button {
    display: none;
  }

  .mapboxgl-ctrl-geocoder--icon-loading {
    animation-name: ${spinAnimation};
    animation-duration: 200ms;
    animation-iteration-count: infinite;
    animation-timing-function: linear; 
  }  

  .mapboxgl-ctrl-geocoder--icon-close {
    fill: #999;
  }

  .suggestions-wrapper {
    position: absolute;
    background-color: #fff;
    border: solid 1px #dedede;
    box-shadow: 0px 0px 3px -1px #b5b5b5;

    ul.suggestions {
      margin: 0;
      padding: 0;
      list-style: none;

      li {
        &:hover, &.active {
          background-color: ${primaryBackgroundColor};
          cursor: pointer;
        }

        a {
          padding: 0.4rem;
          display: block;

          .mapboxgl-ctrl-geocoder--suggestion-title {
            font-weight: 600;
            font-size: 0.9rem;
          }
          .mapboxgl-ctrl-geocoder--suggestion-address {
            color: #666;
            font-size: 0.8rem;
          }
        }
      }
    }
  }
`;

const UseMyLocation = styled.button`
  background-color: ${primaryColor};
  color: #fff;
  border: none;
  box-shadow: none;
  font-size: 1.4rem;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    background-color: ${lighten(0.1, primaryColor)}
  }
`;

const LocationIcon = styled(FontAwesomeIcon)`
  position: absolute;
  top: 0;
  bottom: 0;
  margin: auto 0.5rem;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
  z-index: 10;
`;

const HeadingContainer = styled.div`
  display: flex;
  background-color: ${primaryBackgroundColor};
  box-shadow: 0px 3px 6px -2px rgba(0,0,0,0.2);
  position: relative;
  z-index: 10;
`;

const HeadingLogo = styled.h1`
  display: inline-block;
  padding: 0.7rem 1rem;
  background-color: #000;
  transform: rotate(-3deg);
  color: #fff;
  font-size: 1.3rem;
  line-height: 1.5rem;
  text-align: center;
  font-family: Montserrat, sans-serif;
  position: absolute;
  z-index: 50;
  left: 1rem;
`;

const ContentContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const SearchAndResultsContainer = styled.div`
  position: absolute;
  width: 380px;
  height: 80%;
  top: 10%;
  left: 0;
  z-index: 100;
  display: grid;
  grid-template-rows: auto auto 1fr;
  background-color: ${primaryBackgroundColor};
  box-shadow: 1px 0px 2px 0px rgba(0, 0, 0, 0.2);
`;

const SearchContainer = styled.div`
  padding: 1rem 1rem;
  background-color: ${primaryBackgroundColor};
`;

const FooterContainer = styled.div`
  background-color: ${primaryBackgroundColor};
  box-shadow: 0px -2px 6px -2px rgba(0,0,0,0.2);
  position: relative;
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

  const { userLocation, setUserLocation } = useContext(AppContext);

  const initialMapBounds = !userLocation ? {
    minLong: 12.4, maxLong: 14.4, minLat: 51.4874445, maxLat: 53.4874445,
  } : {
    minLong: userLocation.longitude - 1, maxLong: userLocation.longitude + 1,
    minLat: userLocation.latitude - 1, maxLat: userLocation.latitude + 1,
  };

  const initialCenter: [number, number] = [
    (initialMapBounds.maxLong + initialMapBounds.minLong) / 2,
    (initialMapBounds.maxLat + initialMapBounds.minLat) / 2,
  ];

  const [center, setCenter] = useState<[number, number]>(initialCenter);
  const [mapBounds, setMapBounds] = useState<MapBounds>({...initialMapBounds});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [highlighted, setHighlighted] = useState<[Business] | undefined>(undefined);
  const [geocoderSearchElm, setGeocoderSearchElm] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (userLocation) {
      setMapBounds({
        minLong: userLocation.longitude - 1, maxLong: userLocation.longitude + 1,
        minLat: userLocation.latitude - 1, maxLat: userLocation.latitude + 1,
      });
      setCenter([userLocation.longitude, userLocation.latitude])
    }
  }, [userLocation]);

  const geocoderSearchElmRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (geocoderSearchElmRef && geocoderSearchElmRef.current) {
      setGeocoderSearchElm(geocoderSearchElmRef.current)
    }
  }, [geocoderSearchElmRef, setGeocoderSearchElm])

  const getMapBounds = (newMapBounds: MapBounds) => {
    if (!(isEqual(newMapBounds, mapBounds))) {
      setMapBounds({...newMapBounds});
    }
  };
  const {loading, error, data} = useQuery<SuccessResponse, SearchVariables>(SEARCH_BUSINESSES, {
    variables: {...mapBounds, searchQuery},
  });

  const isLoading = loading || userLocation === undefined;

  let coordinates: Business[];
  if (isLoading) {
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

  const getUsersLocation = () => {
    const onSuccess = ({coords: {latitude, longitude}}: Position) => {
      const country2LetterCode =
        userLocation && userLocation.country2LetterCode ? userLocation.country2LetterCode : '';
      setCenter([longitude + (Math.random() * 0.00001), latitude + (Math.random() * 0.00001)]);
      setUserLocation({country2LetterCode, latitude, longitude});
    };
    const onError = () => {
      console.error('Unable to retrieve your location');
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(onSuccess, onError);
    }
  }

  return (
    <Root>
      <HeadingContainer>
        <div><HeadingLogo>#supportyourlocal</HeadingLogo></div>
      </HeadingContainer>

      <ContentContainer>

        <SearchAndResultsContainer>
          <GeoCoderSearchContainer>
            <GeoCoderSearch ref={geocoderSearchElmRef}>
              <LocationIcon icon={faMapMarkerAlt} />
            </GeoCoderSearch>
            <UseMyLocation onClick={getUsersLocation}>
              <FontAwesomeIcon icon={faStreetView} />
            </UseMyLocation>
          </GeoCoderSearchContainer>
          <SearchContainer>
            <StandardSearch
              placeholder={'Search for a shop in this area'}
              initialQuery={''}
              setSearchQuery={setSearchQuery}
              focusOnMount={false}
            />
          </SearchContainer>
          <SearchPanel
            data={coordinates}
            loading={isLoading}
            setHighlighted={setHighlighted}
          />
        </SearchAndResultsContainer>

        <Map
          coordinates={coordinates}
          getMapBounds={getMapBounds}
          mapBounds={mapBounds}
          initialCenter={center}
          highlighted={highlighted}
          loading={isLoading}
          geocoderSearchElm={geocoderSearchElm}
          key={'main-map'}
        />

      </ContentContainer>

      <FooterContainer>
      </FooterContainer>
    </Root>
  );

};

export default LandingPage;

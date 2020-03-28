import { useQuery } from '@apollo/react-hooks';
import {
  faMapMarkerAlt,
  faStreetView,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GetString } from 'fluent-react/compat';
import gql from 'graphql-tag';
import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';
import {lighten} from 'polished';
import React, {useContext, useEffect, useRef, useState} from 'react';
import Helmet from 'react-helmet';
import styled, {keyframes} from 'styled-components/macro';
import { AppContext } from '../../App';
import LoaderSmall from '../../components/general/LoaderSmall';
import Map, {MapBounds} from '../../components/map';
import SearchPanel, {mobileWidth} from '../../components/searchPanel';
import StandardSearch from '../../components/searchPanel/StandardSearch';
import {
  AppLocalizationAndBundleContext,
} from '../../contextProviders/getFluentLocalizationContext';
import {
  Business,
} from '../../graphQLTypes';
import { Content } from '../../styling/Grid';

const primaryBackgroundColor = '#f3f3f3';
const primaryColor = '#215890';

const Root = styled(Content)`
  display: grid;
  height: 100%;
  overflow: hidden;
  grid-template-rows: 70px 1fr 70px;

  @media (max-width: ${mobileWidth}px) {
    grid-template-rows: 40px 1fr 30px;
  }
`;

const GeoCoderSearchContainer = styled.div`
  background-color: #e2e2e2;
  padding: 1rem 1rem;
  display: grid;
  grid-template-columns: 1fr 2.5rem;
  position: relative;
`;

const GeoCoderSearchLoader = styled.div`
  position: absolute;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
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
    width: 100%;

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

  @media (max-width: ${mobileWidth}px) {
    display: grid;
    grid-template-rows: 1fr auto;
  }
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

  @media (max-width: 800px) {
    width: 290px;
  }

  @media (max-width: ${mobileWidth}px) {
    position: relative;
    width: 100%;
    height: 100%;
    top: 0;
  }
`;

const SearchContainer = styled.div`
  padding: 1rem 1rem;
  background-color: ${primaryBackgroundColor};
`;

const NavLinks = styled.nav`
  flex-grow: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
`;

const NavLink = styled.a`
  margin-right: 1.5rem;
  font-weight: 700;
  color: #333;
  border-bottom: solid 1px transparent;
  font-size: 0.9rem;
  text-decoration: none;

  &:hover {
    border-bottom-color: #333;
  }
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
      industry
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

  const {localization} = useContext(AppLocalizationAndBundleContext);
  const getFluentString: GetString = (...args) => localization.getString(...args);

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
      setCenter([userLocation.longitude, userLocation.latitude]);
    }
  }, [userLocation]);

  const geocoderSearchElmRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (geocoderSearchElmRef && geocoderSearchElmRef.current) {
      setGeocoderSearchElm(geocoderSearchElmRef.current);
    }
  }, [geocoderSearchElmRef, setGeocoderSearchElm]);

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
      setCenter([longitude + (Math.random() * 0.00001), latitude + (Math.random() * 0.00001)]);
      setUserLocation({latitude, longitude});
    };
    const onError = () => {
      console.error('Unable to retrieve your location');
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(onSuccess, onError);
    }
  };

  const defaultMetaTitle = getFluentString('meta-data-base-title');
  const defaultMetaDescription = getFluentString('meta-data-base-description');

  return (
    <>
      <Helmet>
        {/* Set default meta data values */}
        <title>{defaultMetaTitle}</title>
        <meta name='description' content={defaultMetaDescription} />
        <meta property='og:title' content={defaultMetaTitle} />
        <meta property='og:description' content={defaultMetaDescription} />
      </Helmet>
      <Root>
        <HeadingContainer>
          <div><HeadingLogo>{defaultMetaTitle}</HeadingLogo></div>
          <NavLinks>
            <NavLink
              href={'https://www.supportyourlocal.online/'}
            >
              {getFluentString('navigation-links-mission')}
            </NavLink>
            <NavLink
              href={'https://www.supportyourlocal.online/shop-eintragen'}
            >
              {getFluentString('navigation-links-for-shop-owners')}
            </NavLink>
            <NavLink
              href={'https://www.supportyourlocal.online/ueber'}
            >
              {getFluentString('navigation-links-about')}
            </NavLink>
          </NavLinks>
        </HeadingContainer>

        <ContentContainer>

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

          <SearchAndResultsContainer>
            <GeoCoderSearchContainer>
              <GeoCoderSearch ref={geocoderSearchElmRef}>
                <GeoCoderSearchLoader><LoaderSmall /></GeoCoderSearchLoader>
                <LocationIcon icon={faMapMarkerAlt} />
              </GeoCoderSearch>
              <UseMyLocation onClick={getUsersLocation}>
                <FontAwesomeIcon icon={faStreetView} />
              </UseMyLocation>
            </GeoCoderSearchContainer>
            <SearchContainer>
              <StandardSearch
                placeholder={getFluentString('ui-text-search-for-a-shop-placegholer')}
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

        </ContentContainer>

        <FooterContainer>
          <NavLinks>
            <NavLink
              href={'https://www.supportyourlocal.online/presse'}
            >
              {getFluentString('navigation-links-press')}
            </NavLink>
            <NavLink
              href={'https://www.supportyourlocal.online/kontakt'}
            >
              {getFluentString('navigation-links-contact')}
            </NavLink>
            <NavLink
              href={'https://www.supportyourlocal.online/datenschutz'}
            >
              {getFluentString('navigation-links-data-privacy')}
            </NavLink>
            <NavLink
              href={'https://www.supportyourlocal.online/impressum'}
            >
              {getFluentString('navigation-links-imprint')}
            </NavLink>
          </NavLinks>
        </FooterContainer>
      </Root>
    </>
  );

};

export default LandingPage;

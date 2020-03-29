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
import {darken} from 'polished';
import queryString from 'query-string';
import React, {useContext, useEffect, useRef, useState} from 'react';
import Helmet from 'react-helmet';
import styled, {keyframes} from 'styled-components/macro';
import { AppContext } from '../../App';
import LoaderSmall from '../../components/general/LoaderSmall';
import Map, {Coordinate, MapBounds} from '../../components/map';
import SearchPanel, {mobileWidth} from '../../components/searchPanel';
import StandardSearch from '../../components/searchPanel/StandardSearch';
import {
  AppLocalizationAndBundleContext,
} from '../../contextProviders/getFluentLocalizationContext';
import {
  Business,
} from '../../graphQLTypes';
import usePrevious from '../../hooks/usePrevious';
import { Content } from '../../styling/Grid';
import {
  borderRadius,
  primaryColor,
  primaryFont,
  secondaryColor,
  secondaryFont,
} from '../../styling/styleUtils';
import {getDistanceFromLatLonInMiles} from '../../Utils';

const primaryBackgroundColor = '#f3f3f3';

const Root = styled(Content)`
  display: grid;
  height: 100%;
  overflow: hidden;
  grid-template-rows: 80px 1fr 70px;

  @media (max-width: ${mobileWidth}px) {
    grid-template-rows: 40px 1fr 30px;
  }
`;

const GeoCoderSearchContainer = styled.div`
  background-color: ${primaryColor};
  padding: 1rem 1rem;
  display: grid;
  grid-template-columns: 1fr 2.5rem;
  position: relative;
  border-top-right-radius: ${borderRadius}px;
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
  box-sizing: border-box;
  background-color: #fff;
  position: relative;
  z-index: 100;
  border-top-left-radius: ${borderRadius}px;
  border-bottom-left-radius: ${borderRadius}px;

  input.mapboxgl-ctrl-geocoder--input {
    padding: 8px 8px 8px 2.5rem;
    border: solid 1px transparent;
    box-sizing: border-box;
    width: 100%;
    font-size: 1.2rem;
    font-weight: 300;
    outline: none;
    border-top-left-radius: ${borderRadius}px;
    border-bottom-left-radius: ${borderRadius}px;
    color: #001240;
    font-family: ${secondaryFont};

    &:focus {
      border-color: ${secondaryColor};
    }

    &::placeholder {
      font-family: ${secondaryFont};
      color: #b1bccb;
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
    width: 100%;

    ul.suggestions {
      width: 100%;
      background-color: #fff;
      border: solid 1px #dedede;
      box-shadow: 0px 0px 3px -1px #b5b5b5;
      margin: 0;
      padding: 0;
      list-style: none;
      border-radius: ${borderRadius}px;
      overflow: hidden;

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
  background-color: ${secondaryColor};
  color: ${primaryColor};
  border: none;
  box-shadow: none;
  font-size: 1.4rem;
  display: flex;
  justify-content: center;
  align-items: center;
  border-top-right-radius: ${borderRadius}px;
  border-bottom-right-radius: ${borderRadius}px;

  &:hover {
    background-color: ${darken(0.1, secondaryColor)}
  }
`;

const LocationIcon = styled(FontAwesomeIcon)`
  position: absolute;
  top: 0;
  bottom: 0;
  margin: auto 0.5rem;
  font-size: 1.5rem;
  color: #b1bccb;
  cursor: pointer;
  z-index: 10;
`;

const HeadingContainer = styled.div`
  display: flex;
  background-color: ${primaryColor};
  box-shadow: 0px 3px 6px -2px rgba(0,0,0,0.2);
  position: relative;
  z-index: 10;
`;

const HeadingLogo = styled.h1`
  display: inline-block;
  padding: 0.7rem 1rem;
  background-color: ${secondaryColor};
  transform: rotate(-3deg);
  color: ${primaryColor};
  font-size: 1.3rem;
  line-height: 1.5rem;
  text-align: center;
  font-family: ${primaryFont};
  position: absolute;
  z-index: 50;
  left: 1rem;
`;

const Hash = styled.span`
  color: #fff;
  margin-right: 0.3rem;
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
  background-color: #fff;
  box-shadow: 1px 1px 2px 0px rgba(0, 0, 0, 0.2);
  border-top-right-radius: ${borderRadius}px;
  border-bottom-right-radius: ${borderRadius}px;

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
  background-color: #fff;
`;

const NavLinks = styled.nav`
  flex-grow: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
  font-family: ${primaryFont};
`;

const NavLink = styled.a`
  margin-right: 1.5rem;
  font-weight: 400;
  color: #fff;
  border-bottom: solid 1px transparent;
  font-size: 0.9rem;
  text-decoration: none;
  font-size: 16px;

  &:hover {
    color: ${secondaryColor};
    border-bottom-color: ${secondaryColor};
  }
`;

const NavLinkCurrent = styled(NavLink)`
  color: ${secondaryColor};
`;

const FooterContainer = styled.div`
  background-color: ${primaryColor};
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
      latitude
      longitude
    }
  }
`;

interface SearchVariables extends MapBounds {
  searchQuery: string;
}

interface SuccessResponse {
  businesses: Array<{
    id: Business['id'];
    latitude: Business['latitude'];
    longitude: Business['longitude'];
  }>;
}

interface WinodwQuery {
  lat: string | undefined;
  lng: string | undefined;
  query: string | undefined;
}

const LandingPage = () => {
  const { userLocation, setUserLocation } = useContext(AppContext);

  const {localization} = useContext(AppLocalizationAndBundleContext);
  const getFluentString: GetString = (...args) => localization.getString(...args);

  const { lat, lng, query } = queryString.parse(window.location.search);
  const [windowQuery, setWindowQuery] = useState<WinodwQuery | undefined>({ lat, lng, query } as WinodwQuery);
  const initialSearch = windowQuery && windowQuery.query ? query as string : '';
  useEffect(() => window.history.replaceState({}, document.title, '/'), []);

  let initialMapBounds: MapBounds;
  if (windowQuery && windowQuery.lat && windowQuery.lng) {
    const queryLat = parseFloat(lat as string);
    const queryLng = parseFloat(lng as string);
    initialMapBounds = {
      minLong: queryLng - 1, maxLong: queryLng + 1,
      minLat: queryLat - 1, maxLat: queryLat + 1,
    };
  } else if (userLocation) {
    initialMapBounds = {
      minLong: userLocation.longitude - 1, maxLong: userLocation.longitude + 1,
      minLat: userLocation.latitude - 1, maxLat: userLocation.latitude + 1,
    };
  } else {
    initialMapBounds = { minLong: 12.4, maxLong: 14.4, minLat: 51.4874445, maxLat: 53.4874445 };
  }

  const initialCenter: [number, number] = [
    (initialMapBounds.maxLong + initialMapBounds.minLong) / 2,
    (initialMapBounds.maxLat + initialMapBounds.minLat) / 2,
  ];

  const [center, setCenter] = useState<[number, number]>(initialCenter);
  const [mapBounds, setMapBounds] = useState<MapBounds>({...initialMapBounds});
  const [preciseMapBounds, setPreciseMapBounds] = useState<MapBounds>({...initialMapBounds});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [highlighted, setHighlighted] = useState<[Coordinate] | undefined>(undefined);
  const [geocoderSearchElm, setGeocoderSearchElm] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (userLocation && (!windowQuery || (!windowQuery.lat && !windowQuery.lng))) {
      const newMapBounds = {
        minLong: userLocation.longitude - 1, maxLong: userLocation.longitude + 1,
        minLat: userLocation.latitude - 1, maxLat: userLocation.latitude + 1,
      };
      setMapBounds({...newMapBounds});
      setPreciseMapBounds({...newMapBounds});
      setCenter([userLocation.longitude, userLocation.latitude]);
    }
  }, [userLocation, windowQuery]);

  const geocoderSearchElmRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (geocoderSearchElmRef && geocoderSearchElmRef.current) {
      setGeocoderSearchElm(geocoderSearchElmRef.current);
    }
  }, [geocoderSearchElmRef, setGeocoderSearchElm]);

  const getMapBounds = (newMapBounds: MapBounds) => {
    const oldRange = getDistanceFromLatLonInMiles({
      lat1: mapBounds.maxLat,
      lon1: mapBounds.minLong,
      lat2: mapBounds.minLat,
      lon2: mapBounds.maxLong,
    });
    const newRange = getDistanceFromLatLonInMiles({
      lat1: newMapBounds.maxLat,
      lon1: newMapBounds.minLong,
      lat2: newMapBounds.minLat,
      lon2: newMapBounds.maxLong,
    });
    const boundsExtension = 0.5;
    const extendedMapBounds = {
      maxLat: newMapBounds.maxLat + boundsExtension,
      maxLong: newMapBounds.maxLong + boundsExtension,
      minLat: newMapBounds.minLat - boundsExtension,
      minLong: newMapBounds.minLong - boundsExtension,
    };
    if (
        !(isEqual(newMapBounds, mapBounds)) && (
          (newMapBounds.maxLat > mapBounds.maxLat) ||
          (newMapBounds.maxLong > mapBounds.maxLong) ||
          (newMapBounds.minLat < mapBounds.minLat) ||
          (newMapBounds.minLong < mapBounds.minLong) ||
          (oldRange > 500 && newRange <= 500)
        )
      ) {
      const extendedRange = getDistanceFromLatLonInMiles({
        lat1: extendedMapBounds.maxLat,
        lon1: extendedMapBounds.minLong,
        lat2: extendedMapBounds.minLat,
        lon2: extendedMapBounds.maxLong,
      });
      const boundsToUse = extendedRange > 400 ? newMapBounds : extendedMapBounds;
      setMapBounds({...boundsToUse});
    }
    setPreciseMapBounds({...newMapBounds});
  };

  const {loading, error, data} = useQuery<SuccessResponse, SearchVariables>(SEARCH_BUSINESSES, {
    variables: {...mapBounds, searchQuery},
  });

  const isLoading = loading || userLocation === undefined;
  const prevData = usePrevious(data);
  const dataToUse = loading === true ? prevData : data;

  let coordinates: Coordinate[];
  if (dataToUse !== undefined) {
    const { businesses } = dataToUse;
    coordinates = sortBy(businesses, ['name']);
  } else if (isLoading) {
    coordinates = [];
  } else if (error !== undefined) {
    console.error(error);
    coordinates = [];
  } else {
    coordinates = [];
  }

  const getUsersLocation = () => {
    const onSuccess = ({coords: {latitude, longitude}}: Position) => {
      setCenter([longitude + (Math.random() * 0.00001), latitude + (Math.random() * 0.00001)]);
      setUserLocation({latitude, longitude});
      setWindowQuery(undefined);
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
          <div>
            <HeadingLogo>
              <Hash>#</Hash>
              {getFluentString('base-title-no-hash')}
            </HeadingLogo>
          </div>
          <NavLinks>
            <NavLink
              href={'https://www.supportyourlocal.online/'}
            >
              {getFluentString('navigation-links-mission')}
            </NavLink>
            <NavLinkCurrent
              href={'/'}
            >
              {getFluentString('navigation-links-favorite-places')}
            </NavLinkCurrent>
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
                initialQuery={initialSearch}
                setSearchQuery={setSearchQuery}
                focusOnMount={false}
              />
            </SearchContainer>
            <SearchPanel
              setHighlighted={setHighlighted}
              mapBounds={preciseMapBounds}
              searchQuery={searchQuery}
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

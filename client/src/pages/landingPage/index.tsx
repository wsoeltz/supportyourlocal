import { useQuery } from '@apollo/react-hooks';
import {
  faFacebookSquare,
  faInstagram,
} from '@fortawesome/free-brands-svg-icons';
import {
  faBars,
  faMapMarkerAlt,
  faStreetView,
  faTimes,
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
import Popup from '../../components/general/Popup';
import Map, {Coordinate, MapBounds} from '../../components/map';
import SearchPanel, {mobileWidth} from '../../components/searchPanel';
import {
  AppLocalizationAndBundleContext,
} from '../../contextProviders/getFluentLocalizationContext';
import {
  Business,
} from '../../graphQLTypes';
import { Content } from '../../styling/Grid';
import {
  borderRadius,
  primaryColor,
  primaryFont,
  secondaryColor,
  secondaryFont,
} from '../../styling/styleUtils';
import {getDistanceFromLatLonInMiles} from '../../Utils';
import HeartImageSVGUrl from './heart-image.svg';
import { transformAllData } from './Utils';

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
  height: 100%;
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
          .custom_data__container {
            display: flex;
            align-items: center;
          }
          .custom_data__icon {
            width: 20px;
            height: 30px;
            flex-shrink: 0;
            background-repeat: no-repeat;
            background-size: contain;
            margin-right: 6px;
            color: rgba(255, 255, 255, 0);
            background-image: url("data:image/svg+xml,%3Csvg aria-hidden='true' focusable='false' data-prefix='fas' data-icon='map-marker-alt' class='svg-inline--fa fa-map-marker-alt fa-w-12 ' role='img' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 384 512'%3E%3Cpath fill='%23001240' d='M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z'%3E%3C/path%3E%3C/svg%3E");
          }
        }
      }
    }

    .mapbox-gl-geocoder--no-results {
      padding: 0.4rem;
      width: 100%;
      background-color: #fff;
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
  justify-content: space-between;
  background-color: ${primaryColor};
  box-shadow: 0px 3px 6px -2px rgba(0,0,0,0.2);
  position: relative;
  z-index: 100;
`;

const HeadingLogoContainer = styled.div`
  width: 250px;
  position: relative;
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

const TotalPlacesContainer = styled.div`
  display: flex;
  flex-direction: column;

  @media (max-width: ${mobileWidth}px) {
    padding: 0 0.5rem;
    background-color: rgba(0, 0, 0, 0.5);
  }

  @media (max-width: 500px) {
    display: none;
  }
`;

const TotalValue = styled.div`
  margin-top: 0.4rem;
  margin-bottom: 0.2rem;
  border-radius: 7px;
  background-color: rgba(0, 0, 0, 0.5);
  font-size: 1.4rem;
  line-height: 1.8;
  font-weight: 700;
  color: #fff;
  text-align: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  @media(max-width: 990px) {
    font-size: 1.15rem;
  }

  @media (max-width: ${mobileWidth}px) {
    font-size: 1rem;
    line-height: 1;
    background-color: transparent;
  }
`;
const TotalText = styled.p`
  color: #fff;
  font-size: 0.85rem;

  @media(max-width: 990px) {
    font-size: 0.8rem;
  }
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

const NavLinks = styled.nav`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
  font-family: ${primaryFont};
`;

const mobileMenuScreenWidth = 900; // in px

const NavLink = styled.a`
  margin-right: 1.5rem;
  font-weight: 400;
  color: #fff;
  border-bottom: solid 1px transparent;
  font-size: 0.9rem;
  text-decoration: none;

  &:hover {
    color: ${secondaryColor};
    border-bottom-color: ${secondaryColor};
  }
`;

const HeaderNavLink = styled(NavLink)`
  font-size: 16px;

  @media (max-width: ${mobileMenuScreenWidth}px) {
    margin: 0.75rem 0;
  }
`;

const FooterNavLink = styled(NavLink)`
  font-size: 15px;

  @media (max-width: ${mobileWidth}px) {
    font-size: 14px;
    margin-right: 1rem;
  }

  @media (max-width: 345px) {
    font-size: 12px;
  }
`;

const NavLinkCurrent = styled(HeaderNavLink)`
  color: ${secondaryColor};
`;

const MobileMenuButton = styled.button`
  padding: 0 1rem;
  background-color: ${primaryColor};
  color: #fff;
  font-size: 14px;
  text-transform: uppercase;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  outline: none;

  &:hover {
    color: ${secondaryColor};
  }

  @media (max-width: ${mobileWidth}px) {
    font-size: 10px;
  }
`;

const MobileMenuIcon = styled(FontAwesomeIcon)`
  font-size: 28px;

  @media (max-width: ${mobileWidth}px) {
    font-size: 20px;
  }
`;

const MobileMenu = styled.nav`
  position: absolute;
  right: 0;
  bottom: 0;
  flex-direction: column;
  transform: translateY(100%);
  background-color: ${primaryColor};
  padding: 1rem;
`;

const FooterContainer = styled.div`
  background-color: ${primaryColor};
  box-shadow: 0px -2px 6px -2px rgba(0,0,0,0.2);
  position: relative;
  display: flex;
  justify-content: space-between;
`;

const SocialIconsContainer = styled(NavLinks)`
  margin-right: auto;
  justify-content: flex-start;
  margin-left: 1rem;
`;

const SocialNavLink = styled(FooterNavLink)`
  font-size: 1.5rem;
  margin-right: 1rem;
  border: none;
`;

const PopupGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;

  @media (max-width: 440px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    grid-row-gap: 3rem;
  }
`;

const PopupTitle = styled.h2`
  margin-top: 0;
`;

const PopupImg = styled.img`
  width: 180px;
  margin: auto;
`;

const PopupButton = styled.a`
  padding: 0.3rem 0.4rem;
  background-color: ${secondaryColor};
  border: solid 2px ${secondaryColor};
  color: ${primaryColor};
  text-decoration: none;
  text-align: center;
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

const PopupButtonSmall = styled(PopupButton)`
  font-size: 0.8rem;
  text-transform: uppercase;
  margin-bottom: 1rem;

  @media (max-width: ${mobileWidth}px) {
    white-space: normal;
    width: auto;
    height: auto;
  }
`;

const DisclaimerButtons = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const DissmissButton = styled.button`
  background-color: transparent;
`;

const GET_ALL_BUSINESS = gql`
  query AllBusinesses {
    businesses {
      id
      name
      address
      latitude
      longitude
    }
  }
`;

const localStoragePopupHasBeenDismissed = 'localStoragePopupHasBeenDismissed';
const localStorageDisclaimerHasBeenDismissed = 'localStorageDisclaimerHasBeenDismissed';

interface AllBusinessesSuccess {
  businesses: Array<{
    id: Business['id'];
    name: Business['name'];
    address: Business['address'];
    latitude: Business['latitude'];
    longitude: Business['longitude'];
  }>;
}

interface WinodwQuery {
  lat: string | undefined;
  lng: string | undefined;
  tooltipId: string | undefined;
}

const LandingPage = () => {
  const { userLocation, setUserLocation, windowWidth } = useContext(AppContext);

  const {localization} = useContext(AppLocalizationAndBundleContext);
  const getFluentString: GetString = (...args) => localization.getString(...args);

  const { lat, lng, tooltipId } = queryString.parse(window.location.search);
  const [windowQuery, setWindowQuery] = useState<WinodwQuery | undefined>({ lat, lng, tooltipId } as WinodwQuery);

  const initialPopupState = localStorage.getItem(localStoragePopupHasBeenDismissed);
  const [isPopupShown, setIsPopupShown] = useState<boolean>(!initialPopupState);
  const initialDisclaimerState = localStorage.getItem(localStorageDisclaimerHasBeenDismissed);
  const [isDisclaimerShown, setIsDisclaimerShown] = useState<boolean>(!initialDisclaimerState);

  const {loading, error, data: allData} = useQuery<AllBusinessesSuccess>(GET_ALL_BUSINESS);
  const allBusiness = allData && allData.businesses ? transformAllData(allData.businesses) : undefined;

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

  const initialHighlighted: [Coordinate] | undefined =
    windowQuery && windowQuery.tooltipId && windowQuery.lat && windowQuery.lng
      ? [{
          id: windowQuery.tooltipId,
          latitude: parseFloat(windowQuery.lat),
          longitude: parseFloat(windowQuery.lng),
        }]
      : undefined;

  const [center, setCenter] = useState<[number, number]>(initialCenter);
  const [mapBounds, setMapBounds] = useState<MapBounds>({...initialMapBounds});
  const [preciseMapBounds, setPreciseMapBounds] = useState<MapBounds>({...initialMapBounds});
  const [highlighted, setHighlighted] = useState<[Coordinate] | undefined>(initialHighlighted);
  const [geocoderSearchElm, setGeocoderSearchElm] = useState<HTMLElement | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [loadingUsersLocation, setLoadingUsersLocation] = useState<boolean>(false);

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

  const isLoading = loading || userLocation === undefined;

  let coordinates: Coordinate[];
  if (allData !== undefined) {
    const range = getDistanceFromLatLonInMiles({
      lat1: preciseMapBounds.minLat,
      lat2: preciseMapBounds.maxLat,
      lon1: preciseMapBounds.maxLong,
      lon2: preciseMapBounds.minLong,
    });
    if (range > 500) {
      coordinates = [];
    } else {
      const { businesses } = allData;
      coordinates = businesses.filter(business => {
        if (
          business.latitude > preciseMapBounds.minLat && business.latitude < preciseMapBounds.maxLat &&
          business.longitude > preciseMapBounds.minLong && business.longitude < preciseMapBounds.maxLong
        ) {
          return true;
        } else {
          return false;
        }
      });
      const currentCenter = [
        (preciseMapBounds.maxLong + preciseMapBounds.minLong) / 2,
        (preciseMapBounds.maxLat + preciseMapBounds.minLat) / 2,
      ];
      coordinates = sortBy(coordinates, (coord) => getDistanceFromLatLonInMiles({
        lat1: coord.latitude,
        lat2: currentCenter[1],
        lon1: coord.longitude,
        lon2: currentCenter[0],
      }));
    }
  } else if (isLoading) {
    coordinates = [];
  } else if (error !== undefined) {
    console.error(error);
    coordinates = [];
  } else {
    coordinates = [];
  }

  const getUsersLocation = () => {
    setLoadingUsersLocation(true);
    const onSuccess = ({coords: {latitude, longitude}}: Position) => {
      setCenter([longitude + (Math.random() * 0.00001), latitude + (Math.random() * 0.00001)]);
      setUserLocation({latitude, longitude});
      setWindowQuery(undefined);
      setLoadingUsersLocation(false);
    };
    const onError = () => {
      console.error('Unable to retrieve your location');
      setLoadingUsersLocation(false);
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(onSuccess, onError);
    }
  };

  const usersLocationButtonContent = loadingUsersLocation
    ? <LoaderSmall color={primaryColor} /> : <FontAwesomeIcon icon={faStreetView} />;

  const defaultMetaTitle = getFluentString('meta-data-base-title');
  const defaultMetaDescription = getFluentString('meta-data-base-description');

  let navigation: React.ReactElement<any>;
  if (windowWidth > mobileMenuScreenWidth) {
    navigation = (
      <NavLinks>
        <HeaderNavLink
          href={'https://www.supportyourlocal.online/'}
        >
          {getFluentString('navigation-links-mission')}
        </HeaderNavLink>
        <NavLinkCurrent
          href={'/'}
        >
          {getFluentString('navigation-links-favorite-places')}
        </NavLinkCurrent>
        <HeaderNavLink
          href={'https://www.supportyourlocal.online/shop-eintragen'}
        >
          {getFluentString('navigation-links-for-shop-owners')}
        </HeaderNavLink>
        <HeaderNavLink
          href={'https://www.supportyourlocal.online/ueber'}
        >
          {getFluentString('navigation-links-about')}
        </HeaderNavLink>
      </NavLinks>
    );
  } else {
    const display = isMobileMenuOpen ? 'flex' : 'none';
    const menuFluentId =  isMobileMenuOpen ? 'ui-text-menu-close' : 'ui-text-open-menu';
    const icon = isMobileMenuOpen ? faTimes : faBars;
    navigation = (
      <>
        <MobileMenuButton onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {getFluentString(menuFluentId)}
          <MobileMenuIcon icon={icon} />
        </MobileMenuButton>
        <MobileMenu style={{display}}>
          <HeaderNavLink
            href={'https://www.supportyourlocal.online/'}
          >
            {getFluentString('navigation-links-mission')}
          </HeaderNavLink>
          <NavLinkCurrent
            href={'/'}
          >
            {getFluentString('navigation-links-favorite-places')}
          </NavLinkCurrent>
          <HeaderNavLink
            href={'https://www.supportyourlocal.online/shop-eintragen'}
          >
            {getFluentString('navigation-links-for-shop-owners')}
          </HeaderNavLink>
          <HeaderNavLink
            href={'https://www.supportyourlocal.online/ueber'}
          >
            {getFluentString('navigation-links-about')}
          </HeaderNavLink>
        </MobileMenu>
      </>
    );
  }

  const totalPlacesCount = allBusiness && allBusiness.features.length
    ? allBusiness.features.length : <LoaderSmall color={'#fff'} />;

  const dismissPopup = () => {
    localStorage.setItem(localStoragePopupHasBeenDismissed, 'true');
    setIsPopupShown(false);
  };

  const disablePopup = true;

  const popup = isPopupShown && !disablePopup ? (
    <Popup top={0} right={0} width={580} onDismiss={dismissPopup}>
      <PopupGrid>
        <div>
          <PopupTitle>{getFluentString('popup-text-title')}</PopupTitle>
          <p>
            {getFluentString('popup-text-para-1')}
          </p>
          <p>
            {getFluentString('popup-text-para-2')}
          </p>
          <br />
          <PopupButton href='https://www.supportyourlocal.online/' >
            {getFluentString('popup-button-text')}
          </PopupButton>
        </div>
        <PopupImg src={HeartImageSVGUrl} alt={getFluentString('popup-text-title')} />
      </PopupGrid>
    </Popup>
  ) : null;

  const dismissDisclaimer = () => {
    setIsDisclaimerShown(false);
  };
  const dismissDisclaimerPermeneantly = () => {
    localStorage.setItem(localStorageDisclaimerHasBeenDismissed, 'true');
    setIsDisclaimerShown(false);
  };
  const disclaimer = isDisclaimerShown ? (
    <Popup bottom={0} right={0} width={300} onDismiss={dismissDisclaimer}>
      <p>
        <small>
          {getFluentString('disclaimer-popup-text')}
        </small>
      </p>
      <DisclaimerButtons>
        <PopupButtonSmall href={'https://www.supportyourlocal.online/disclaimer'}>
          {getFluentString('disclaimer-popup-more')}
        </PopupButtonSmall>
        <DissmissButton onClick={dismissDisclaimerPermeneantly}>
          {getFluentString('disclaimer-popup-dismiss')}
        </DissmissButton>
      </DisclaimerButtons>
    </Popup>
  ) : null;

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
          <HeadingLogoContainer>
            <HeadingLogo>
              <Hash>#</Hash>
              {getFluentString('base-title-no-hash')}
            </HeadingLogo>
          </HeadingLogoContainer>
          <TotalPlacesContainer>
            <TotalValue>{totalPlacesCount}</TotalValue>
            <TotalText>{getFluentString('heading-text-total-favorite-places')}</TotalText>
          </TotalPlacesContainer>
          {navigation}
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
            customData={allBusiness}
            setHighlighted={setHighlighted}
            key={'main-map'}
          />

          <SearchAndResultsContainer>
            <GeoCoderSearchContainer>
              <GeoCoderSearch ref={geocoderSearchElmRef}>
                <GeoCoderSearchLoader><LoaderSmall /></GeoCoderSearchLoader>
                <LocationIcon icon={faMapMarkerAlt} />
              </GeoCoderSearch>
              <UseMyLocation onClick={getUsersLocation}>
                {usersLocationButtonContent}
              </UseMyLocation>
            </GeoCoderSearchContainer>
            <SearchPanel
              setHighlighted={setHighlighted}
              mapBounds={preciseMapBounds}
              coordinates={coordinates}
              highlighted={highlighted}
            />
          </SearchAndResultsContainer>

          {popup}
          {disclaimer}

        </ContentContainer>

        <FooterContainer>
          <SocialIconsContainer>
            <SocialNavLink
              href={'https://www.instagram.com/supportlocalde/'}
              target='_blank'
            >
              <FontAwesomeIcon icon={faInstagram} />
            </SocialNavLink>
            <SocialNavLink
              href={'https://www.facebook.com/supportlocalDE/'}
              target='_blank'
            >
              <FontAwesomeIcon icon={faFacebookSquare} />
            </SocialNavLink>
          </SocialIconsContainer>
          <NavLinks>
            <FooterNavLink
              href={'https://www.supportyourlocal.online/presse'}
            >
              {getFluentString('navigation-links-press')}
            </FooterNavLink>
            <FooterNavLink
              href={'https://www.supportyourlocal.online/kontakt'}
            >
              {getFluentString('navigation-links-contact')}
            </FooterNavLink>
            <FooterNavLink
              href={'https://www.supportyourlocal.online/datenschutz'}
            >
              {getFluentString('navigation-links-data-privacy')}
            </FooterNavLink>
            <FooterNavLink
              href={'https://www.supportyourlocal.online/impressum'}
            >
              {getFluentString('navigation-links-imprint')}
            </FooterNavLink>
          </NavLinks>
        </FooterContainer>
      </Root>
    </>

  );

};

export default LandingPage;

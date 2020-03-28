import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { GetString } from 'fluent-react/compat';
import debounce from 'lodash/debounce';
import mapboxgl from 'mapbox-gl';
import React, {
  useContext,
  useEffect,
  useState,
} from 'react';
import ReactMapboxGl, {
  Feature,
  Layer,
  MapContext,
  Popup,
  RotationControl,
  ZoomControl,
} from 'react-mapbox-gl';
import styled from 'styled-components';
import {
  AppLocalizationAndBundleContext,
} from '../../contextProviders/getFluentLocalizationContext';
import {
  Business,
  Source,
} from '../../graphQLTypes';
import usePrevious from '../../hooks/usePrevious';
import {
  semiBoldFontBoldWeight,
} from '../../styling/styleUtils';
import {darken} from 'polished';

const accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN ? process.env.REACT_APP_MAPBOX_ACCESS_TOKEN : '';

const Mapbox = ReactMapboxGl({
  accessToken,
  maxZoom: 16,
  scrollZoom: true,
});

const primaryColor = '#215890';

const Root = styled.div`
  width: 100%;
  height: 100%;
  
  .mapboxgl-popup-tip {
    border-top-color: rgba(255, 255, 255, 0.85);
  }
  .mapboxgl-popup-content {
    background-color: rgba(255, 255, 255, 0.85);
  }
`;

const StyledPopup = styled.div`
  text-align: center;
`;

const ClosePopup = styled.div`
  position: absolute;
  top: -0.1rem;
  right: 0.1rem;
  font-size: 0.9rem;
  font-weight: ${semiBoldFontBoldWeight};
  color: #999;

  &:hover {
    cursor: pointer;
  }
`;

const PopupContent = styled.div`
  display: grid;
  grid-template-rows: auto auto auto;
`;

const Header = styled.div`
  grid-row: 1;
`;

const Logo = styled.img`
  max-width: 140px;
  max-height: 80px;
`;

const PopupTitle = styled.h2`
  font-size: 1.1rem;
`;

const PopupLinks = styled.div`
  display: grid;
  grid-auto-columns: 1fr;
  grid-auto-flow: column;
  grid-column-gap: 1rem;
  margin-bottom: 1rem;
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

const PopupAddress = styled.div`
  grid-row: 3;
`;

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLong: number;
  maxLong: number;
}

interface Props {
  coordinates: Business[];
  highlighted?: Business[];
  mapBounds: MapBounds;
  getMapBounds: (mapBounds: MapBounds) => void;
  initialCenter: [number, number] | undefined;
  loading: boolean;
  geocoderSearchElm: HTMLElement | null;
}

interface MapUtilProps {
  map: any;
  getMapBounds: (mapBounds: MapBounds) => void;
  geocoderSearchElm: HTMLElement | null;
  getFluentString: GetString;
}

const MapUtil = ({map, getMapBounds, geocoderSearchElm, getFluentString}: MapUtilProps) => {

  const [hasGeoCoder, setHasGeoCoder] = useState<boolean>(false);

  useEffect(() => {
    const setBounds = debounce(() => {
      const {_sw: sw, _ne: ne} = map.getBounds();
      const newMinLat = sw.lat > ne.lat ? ne.lat : sw.lat;
      const newMaxLat = sw.lat < ne.lat ? ne.lat : sw.lat;
      const newMinLong = sw.lng > ne.lng ? ne.lng : sw.lng;
      const newMaxLong = sw.lng < ne.lng ? ne.lng : sw.lng;
      getMapBounds({
        minLat: newMinLat,
        maxLat: newMaxLat,
        minLong: newMinLong,
        maxLong: newMaxLong,
      });
    }, 500);
    if (map) {
      map.on('dragend', setBounds);
      map.on('zoomend', setBounds);
      if (geocoderSearchElm && !hasGeoCoder) {
        const geocoder = new MapboxGeocoder({
          accessToken,
          mapboxgl,
          placeholder: getFluentString('ui-text-find-a-location'),
          language: navigator.language,
        });
        geocoderSearchElm.appendChild(geocoder.onAdd(map));
        setHasGeoCoder(true);
      }
    }
    return () => {
     if (map) {
        map.off('dragend', setBounds);
        map.off('zoomend', setBounds);
      }
    };
  }, [map, getMapBounds, geocoderSearchElm, hasGeoCoder, getFluentString]);
  return (<></>);
};

const Map = (props: Props) => {
  const {
    coordinates, highlighted, getMapBounds,
    initialCenter, loading, geocoderSearchElm,
  } = props;

  const {localization} = useContext(AppLocalizationAndBundleContext);
  const getFluentString: GetString = (...args) => localization.getString(...args);

  const prevData = usePrevious(coordinates);
  const prevInitialCenter = usePrevious(initialCenter);

  const coordinatesToUse = loading === true && prevData ? prevData : coordinates;

  const [popupInfo, setPopupInfo] = useState<Business | null>(null);
  const [center, setCenter] = useState<[number, number] | undefined>(initialCenter);

  useEffect(() => {
    if (highlighted && highlighted.length === 1) {
      setPopupInfo({...highlighted[0]});
      setCenter([
        highlighted[0].longitude,
        highlighted[0].latitude,
      ]);
    }
  }, [highlighted, setPopupInfo]);

  useEffect(() => {
    if (
        (prevInitialCenter && initialCenter) &&
        (prevInitialCenter[0] !== initialCenter[0] && prevInitialCenter[1] !== initialCenter[1] )
      ) {
      setCenter(initialCenter);
    }
  }, [prevInitialCenter, initialCenter]);

  const togglePointer = (mapEl: any, cursor: string) => {
    mapEl.getCanvas().style.cursor = cursor;
  };

  const features = coordinatesToUse.map(point => {
    const onClick = () => {
      setPopupInfo({...point});
    };
    return (
      <Feature
        coordinates={[point.longitude, point.latitude]}
        onClick={onClick}
        onMouseEnter={(event: any) => togglePointer(event.map, 'pointer')}
        onMouseLeave={(event: any) => togglePointer(event.map, '')}
        properties={{
          'circle-color': primaryColor,
        }}
        key={'' + point.latitude + point.longitude}
      />
    );
  });

  let popup: React.ReactElement<any>;
  if (!popupInfo) {
    popup = <></>;
  } else {
    const {
      name, source, address, website,
      secondaryUrl, logo,
    } = popupInfo;
    let logoImg: React.ReactElement<any> | null;
    if (logo) {
      if (logo.match(/\.(jpeg|jpg|gif|png)$/) !== null) {
        logoImg = <Logo src={logo} alt={name} />;
      } else {
        logoImg = null;
      }
    } else {
      logoImg = null;
    }
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
      secondaryLink = source === Source.firstvoucher
        ? (
            <LinkButton
              href={secondaryUrl}
              target='_blank'
              rel='noopener noreferrer'
            >
              {getFluentString('ui-text-visit-voucher-shop')}
            </LinkButton>
          )
        : (
            <LinkButton
              href={secondaryUrl}
              target='_blank'
              rel='noopener noreferrer'
            >
              {secondaryUrl}
            </LinkButton>
          );
    } else {
      secondaryLink = null;
    }
    popup = (
      <Popup
        coordinates={[popupInfo.longitude, popupInfo.latitude]}
      >
        <StyledPopup>
          <PopupContent>
            <Header>
              {logoImg}
              <PopupTitle>{name}</PopupTitle>
            </Header>
            <PopupLinks>
              {secondaryLink}
              {websiteLink}
            </PopupLinks>
            <PopupAddress>
              {address}
            </PopupAddress>
          </PopupContent>
          <ClosePopup onClick={() => setPopupInfo(null)}>×</ClosePopup>
        </StyledPopup>
      </Popup>
    );

  }

  const mapRenderProps = (mapEl: any) => {
    return (
      <MapUtil
        map={mapEl}
        getMapBounds={getMapBounds}
        geocoderSearchElm={geocoderSearchElm}
        getFluentString={getFluentString}
      />
    );
  };

  return (
    <Root>
      <Mapbox
        // eslint-disable-next-line
        style={'mapbox://styles/supportyourlocal/ck89mllhy08br1iqiu6g54xha'}
        containerStyle={{
          height: '100%',
          width: '100%',
        }}
        center={center}
        onClick={() => setPopupInfo(null)}
        fitBoundsOptions={{padding: 50, linear: true}}
        movingMethod={'flyTo'}
        key={`mapkey`}
      >
        <ZoomControl />
        <RotationControl style={{ top: 80 }} />
        <Layer
          type='circle'
          id='marker'
          paint={{
            'circle-color': ['get', 'circle-color'],
            'circle-radius': {
              base: 5,
              stops: [
                [1, 4],
                [10, 10],
              ],
            },
          }}
        >
          {features}
        </Layer>
        {popup}
        <MapContext.Consumer children={mapRenderProps} />
      </Mapbox>
    </Root>
  );

};

export default Map;

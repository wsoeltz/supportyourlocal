import debounce from 'lodash/debounce';
import React, {
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
  Business,
  Source,
} from '../../graphQLTypes';
import {
  semiBoldFontBoldWeight,
} from '../../styling/styleUtils';

const accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN ? process.env.REACT_APP_MAPBOX_ACCESS_TOKEN : '';

const Mapbox = ReactMapboxGl({
  accessToken,
  maxZoom: 16,
  scrollZoom: true,
});

const primaryColor = '#215890';

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
  max-width: 180px;
  max-height: 180px;
`;

const PopupTitle = styled.h2`
`;

const PopupLinks = styled.div`
  display: grid;
  grid-auto-columns: 1fr;
  grid-auto-flow: column;
  grid-column-gap: 1rem;
  margin-bottom: 1rem;
`;

const LinkButton = styled.a`
  padding: 0.3rem 0.5rem;
  border: solid 1px ${primaryColor};
  color: ${primaryColor};
  text-decoration: none;
  text-transform: uppercase;

  &:hover {
    background-color: ${primaryColor};
    color: #fff;
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
}

const Map = (props: Props) => {
  const {
    coordinates, highlighted, getMapBounds,
    initialCenter,
  } = props;

  const [popupInfo, setPopupInfo] = useState<Business | null>(null);
  const [map, setMap] = useState<any>(null);
  const [center] = useState<[number, number] | undefined>(initialCenter);

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
    }
    return () => {
     if (map) {
        map.off('dragend', setBounds);
        map.off('zoomend', setBounds);
      }
    };
  }, [map, getMapBounds]);

  useEffect(() => {
    if (highlighted && highlighted.length === 1) {
      setPopupInfo({...highlighted[0]});
    }
  }, [highlighted, setPopupInfo]);

  const togglePointer = (mapEl: any, cursor: string) => {
    mapEl.getCanvas().style.cursor = cursor;
  };

  const features = coordinates.map(point => {
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
      name, source, address, email, website,
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
            View Website
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
              First Voucher Page
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
        style={{opacity: 0.85}}
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
              <LinkButton href={'mailto:' + email}>email</LinkButton>
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

  const setMapInContext = (mapEl: any) => setMap(mapEl);

  const mapRenderProps = (mapEl: any) => {
    setMapInContext(mapEl);
    return null;
  };

  return (
      <Mapbox
        // eslint-disable-next-line
        style={'mapbox://styles/supportyourlocal/ck87y26nj0mlj1ikl7ubj5kju'}
        containerStyle={{
          height: '100%',
          width: '100%',
        }}
        center={center}
        onClick={() => setPopupInfo(null)}
        fitBoundsOptions={{padding: 50, linear: true}}
        movingMethod={'jumpTo'}
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
  );

};

export default Map;

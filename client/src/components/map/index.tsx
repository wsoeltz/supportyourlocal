import sortBy from 'lodash/sortBy';
import React, {
  useEffect,
  useState,
} from 'react';
import ReactMapboxGl, {
  Feature,
  Layer,
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

const getMinMax = (coordinates: Business[]) => {
  if (coordinates.length === 0) {
    return { minLat: 27, maxLat: 70, minLong: -32, maxLong: 67 };
  }
  const sortedByLat = sortBy(coordinates, ['latitude']);
  const sortedByLong = sortBy(coordinates, ['longitude']);

  const minLat = sortedByLat[sortedByLat.length - 1].latitude;
  const maxLat = sortedByLat[0].latitude;
  const minLong = sortedByLong[sortedByLong.length - 1].longitude;
  const maxLong = sortedByLong[0].longitude;

  return { minLat, maxLat, minLong, maxLong };
};

interface Props {
  coordinates: Business[];
  highlighted?: Business[];
}

const Map = (props: Props) => {
  const {
    coordinates, highlighted,
  } = props;

  const { minLat, maxLat, minLong, maxLong } = getMinMax(coordinates);

  let initialCenter: [number, number];
  if (highlighted && highlighted.length === 1) {
    initialCenter = [highlighted[0].longitude, highlighted[0].latitude];
  } else if (coordinates.length) {
    initialCenter = [(maxLong + minLong) / 2, (maxLat + minLat) / 2];
  } else {
    initialCenter = [-13.40495, 52.52001];
  }

  const [popupInfo, setPopupInfo] = useState<Business | null>(null);

  const [center, setCenter] = useState<[number, number]>(initialCenter);
  const [fitBounds, setFitBounds] =
    useState<[[number, number], [number, number]] | undefined>([[minLong, minLat], [maxLong, maxLat]]);

  useEffect(() => {
    const coords = getMinMax(coordinates);
    setFitBounds([[coords.minLong, coords.minLat], [coords.maxLong, coords.maxLat]]);
  }, [coordinates]);

  useEffect(() => {
    if (highlighted && highlighted.length === 1) {
      setPopupInfo({...highlighted[0]});
      setCenter([highlighted[0].longitude, highlighted[0].latitude]);
    } else if (coordinates.length === 1) {
      setPopupInfo({...coordinates[0]});
      setCenter([coordinates[0].longitude, coordinates[0].latitude]);
    }
  }, [highlighted, setPopupInfo, setCenter, coordinates]);

  const togglePointer = (mapEl: any, cursor: string) => {
    mapEl.getCanvas().style.cursor = cursor;
  };

  const features = coordinates.map(point => {
    const onClick = () => {
      setPopupInfo({...point});
      setCenter([point.longitude, point.latitude]);
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

  return (
    <>
      <Mapbox
        // eslint-disable-next-line
        style={'mapbox://styles/supportyourlocal/ck87y26nj0mlj1ikl7ubj5kju'}
        containerStyle={{
          height: '100%',
          width: '100%',
        }}
        center={center}
        onClick={() => setPopupInfo(null)}
        fitBounds={fitBounds}
        fitBoundsOptions={{padding: 50, linear: true}}
        movingMethod={'flyTo'}
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
      </Mapbox>
    </>
  );

};

export default Map;

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
  RotationControl,
  ZoomControl,
} from 'react-mapbox-gl';
import styled from 'styled-components';
import {
  AppLocalizationAndBundleContext,
} from '../../contextProviders/getFluentLocalizationContext';
import usePrevious from '../../hooks/usePrevious';
import { primaryColor } from '../../styling/styleUtils';
import StyledPopup from './StyledPopup';

const accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN ? process.env.REACT_APP_MAPBOX_ACCESS_TOKEN : '';

const Mapbox = ReactMapboxGl({
  accessToken,
  maxZoom: 16,
  scrollZoom: true,
});

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

export interface GeoJsonFeature {
  type: string,
  description?: string;
  place_name?: string;
  center?: [number, number];
  address?: string;
  text?: string;
  place_type?: [string];
  properties: {
    title: string,
    address: string,
  },
  geometry: {
    coordinates: [number, number],
    type: string,
  },
}

export interface CustomGeoJson {
  features: GeoJsonFeature[];
}

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLong: number;
  maxLong: number;
}

export interface Coordinate {
  id: string;
  latitude: number;
  longitude: number;
}

interface Props {
  coordinates: Coordinate[];
  highlighted?: Coordinate[];
  mapBounds: MapBounds;
  getMapBounds: (mapBounds: MapBounds) => void;
  initialCenter: [number, number] | undefined;
  loading: boolean;
  geocoderSearchElm: HTMLElement | null;
  customData: CustomGeoJson | undefined;
}

interface MapUtilProps {
  map: any;
  getMapBounds: (mapBounds: MapBounds) => void;
  geocoderSearchElm: HTMLElement | null;
  getFluentString: GetString;
  customData: CustomGeoJson | undefined;
}

const MapUtil = ({map, getMapBounds, geocoderSearchElm, getFluentString, customData}: MapUtilProps) => {

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
      if (geocoderSearchElm && !hasGeoCoder && customData !== undefined) {

        const forwardGeocoder = (query: string) => {
          const matchingFeatures = [];
          for (let i = 0; i < customData.features.length; i++) {
            const feature: GeoJsonFeature = customData.features[i];
            // handle queries with different capitalization than the source data by calling toLowerCase()
            if (
              feature.properties.title
              .toLowerCase()
              .search(query.toLowerCase()) !== -1
            ) {
              // add a tree emoji as a prefix for custom data results
              // using carmen geojson format: https://github.com/mapbox/carmen/blob/master/carmen-geojson.md
              feature.place_name = feature.properties.title;
              feature.center = feature.geometry.coordinates;
              feature.place_type = ['place'];
              matchingFeatures.push(feature);
            }
          }
          return matchingFeatures;
        }

        const geocoder = new MapboxGeocoder({
          accessToken,
          mapboxgl,
          localGeocoder: forwardGeocoder,
          placeholder: getFluentString('ui-text-find-a-location'),
          language: navigator.language,
          countries: 'de',
          render: (item: any) => {
            if (item.id) {
              return `
              <div class="mapboxgl-ctrl-geocoder--suggestion">
                <div class="mapboxgl-ctrl-geocoder--suggestion-title">
                  ${item['text_' + navigator.language]}
                </div>
                <div class="mapboxgl-ctrl-geocoder--suggestion-address">
                  ${item['place_name_' + navigator.language]}
                </div>
              </div>
              `;
            } else {
              return `
              <div class="mapboxgl-ctrl-geocoder--suggestion">
                <div class="custom_data__container">
                  <div class="custom_data__icon"></div>
                  <div class="custom_data__text">
                    <div class="mapboxgl-ctrl-geocoder--suggestion-title">
                      ${item.properties.title}
                    </div>
                    <div class="mapboxgl-ctrl-geocoder--suggestion-address">
                      ${item.properties.address}
                    </div>
                  </div>
                </div>
              </div>
              `;
            }
          }
        });
        geocoderSearchElm.appendChild(geocoder.onAdd(map));
        geocoder.on('result', (e: any) => console.log(e));
        setHasGeoCoder(true);
      }
      const language = navigator.language.includes('de') ? 'de' : 'en'
      map.setLayoutProperty('country-label', 'text-field', [
        'get',
        'name_' + language,
      ]);
    }
    return () => {
     if (map) {
        map.off('dragend', setBounds);
        map.off('zoomend', setBounds);
      }
    };
  }, [map, getMapBounds, geocoderSearchElm, hasGeoCoder, getFluentString, customData]);
  return (<></>);
};

const Map = (props: Props) => {
  const {
    coordinates, highlighted, getMapBounds,
    initialCenter, loading, geocoderSearchElm,
    customData,
  } = props;

  const {localization} = useContext(AppLocalizationAndBundleContext);
  const getFluentString: GetString = (...args) => localization.getString(...args);

  const prevData = usePrevious(coordinates);
  const prevInitialCenter = usePrevious(initialCenter);

  const coordinatesToUse = loading === true && prevData ? prevData : coordinates;

  const [popupInfo, setPopupInfo] = useState<Coordinate | null>(null);
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
    popup = (
      <StyledPopup {...popupInfo}
        getFluentString={getFluentString}
        closePopup={() => setPopupInfo(null)}
      />
    );
  }

  const mapRenderProps = (mapEl: any) => {
    return (
      <MapUtil
        map={mapEl}
        getMapBounds={getMapBounds}
        geocoderSearchElm={geocoderSearchElm}
        getFluentString={getFluentString}
        customData={customData}
      />
    );
  };

  return (
    <Root>
      <Mapbox
        // eslint-disable-next-line
        style={'mapbox://styles/supportyourlocal/ck8d2yehn0exr1iofqyvenrad'}
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

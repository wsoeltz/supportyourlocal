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
  GeoJSONLayer,
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
import { primaryColor, secondaryColor } from '../../styling/styleUtils';
import {getDistanceFromLatLonInMiles} from '../../Utils';
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
  type: string;
  description?: string;
  place_name?: string;
  center?: [number, number];
  address?: string;
  text?: string;
  place_type?: [string];
  properties: {
    title: string,
    address: string,
    gqlId: string,
  };
  geometry: {
    coordinates: [number, number],
    type: string,
  };
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
  setHighlighted: (value: [Coordinate] | undefined) => void;
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
  setHighlighted: (value: [Coordinate] | undefined) => void;
  setPopupInfo: (value: Coordinate | null) => void;
}

const MapUtil = (props: MapUtilProps) => {
  const {
    map, getMapBounds, geocoderSearchElm, getFluentString, customData,
    setHighlighted, setPopupInfo,
  } = props;
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

    map.on('dragend', setBounds);
    map.on('zoomend', setBounds);

    const clusterClick = (e: any) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['cluster_layer'],
      });
      const clusterId = features[0].properties.cluster_id;
      if (clusterId !== undefined) {
        map.getSource('source_id').getClusterExpansionZoom(
          clusterId,
          function(err: any, zoom: any) {
            if (err) {
              return;
            }
            map.easeTo({
              center: features[0].geometry.coordinates,
              zoom,
            });
          },
        );
      } else {
        if (customData) {
          const match = customData.features.find(({geometry: {coordinates}}) => {
            const distance = getDistanceFromLatLonInMiles({
              lat1: coordinates[1],
              lat2: e.lngLat.lat,
              lon1: coordinates[0],
              lon2: e.lngLat.lng,
            });
            return distance < 0.25;
          });
          if (match) {
            const animationDuration = 600;
            map.easeTo({
              center: match.geometry.coordinates,
              zoom: 13,
              duration: animationDuration,
            });
            setPopupInfo({
              latitude: match.geometry.coordinates[1],
              longitude: match.geometry.coordinates[0],
              id: match.properties.gqlId,
            });
          }
        }
      }
    };
    const clusterTextClick = (e: any) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['clustered_text'],
      });
      const clusterId = features[0].properties.cluster_id;
      if (clusterId !== undefined) {
        map.getSource('source_id').getClusterExpansionZoom(
          clusterId,
          function(err: any, zoom: any) {
            if (err) {
              return;
            }
            map.easeTo({
              center: features[0].geometry.coordinates,
              zoom,
            });
          },
        );
      } else {
        if (customData) {
          const match = customData.features.find(({geometry: {coordinates}}) => {
            const distance = getDistanceFromLatLonInMiles({
              lat1: coordinates[1],
              lat2: e.lngLat.lat,
              lon1: coordinates[0],
              lon2: e.lngLat.lng,
            });
            return distance < 0.25;
          });
          if (match) {
            const animationDuration = 600;
            map.easeTo({
              center: match.geometry.coordinates,
              zoom: 13,
              duration: animationDuration,
            });
            setPopupInfo({
              latitude: match.geometry.coordinates[1],
              longitude: match.geometry.coordinates[0],
              id: match.properties.gqlId,
            });
          }
        }
      }
    };

    map.on('click', 'cluster_layer', clusterClick);
    map.on('click', 'clustered_text', clusterTextClick);

    if (geocoderSearchElm && !hasGeoCoder && customData !== undefined) {

      const forwardGeocoder = (query: string) => {
        const matchingFeatures = [];
        for (const feature of customData.features) {
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
      };

      const geocoder = new MapboxGeocoder({
        accessToken,
        mapboxgl,
        localGeocoder: forwardGeocoder,
        placeholder: getFluentString('ui-text-find-a-location'),
        language: navigator.language,
        countries: 'de',
        marker: false,
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
        },
        flyTo: {
          bearing: 1,
          // These options control the flight curve, making it move
          // slowly and zoom out almost completely before starting
          // to pan.
          speed: 4, // make the flying slow
          curve: 1, // change the speed at which it zooms out
          // This can be any easing function: it takes a number between
          // 0 and 1 and returns another number between 0 and 1.
          easing(t: any) {
            return t;
          },
        },
      });
      geocoderSearchElm.appendChild(geocoder.onAdd(map));
      geocoder.on('result', (e: any) => {
        if (e.result && e.result.properties && e.result.properties.gqlId) {
          setHighlighted([{
            id: e.result.properties.gqlId,
            latitude: e.result.center[1],
            longitude: e.result.center[0],
          }]);
        } else {
          setHighlighted(undefined);
        }
      });
      setHasGeoCoder(true);
    }
    const language = navigator.language.includes('de') ? 'de' : 'en';
    map.setLayoutProperty('country-label', 'text-field', [
      'get',
      'name_' + language,
    ]);
    return () => {
     if (map) {
        map.off('dragend', setBounds);
        map.off('zoomend', setBounds);
        map.off('click', 'cluster_layer', clusterClick);
        map.off('click', 'clustered_text', clusterTextClick);
      }
    };
  }, [
    map, getMapBounds, geocoderSearchElm, hasGeoCoder, getFluentString,
    customData, setHighlighted, setPopupInfo,
  ]);
  return (<></>);
};

const Map = (props: Props) => {
  const {
    coordinates, highlighted, getMapBounds,
    initialCenter, loading, geocoderSearchElm,
    customData, setHighlighted,
  } = props;

  const {localization} = useContext(AppLocalizationAndBundleContext);
  const getFluentString: GetString = (...args) => localization.getString(...args);

  const prevData = usePrevious(coordinates);
  const prevInitialCenter = usePrevious(initialCenter);

  const coordinatesToUse = loading === true && prevData ? prevData : coordinates;

  const [popupInfo, setPopupInfo] = useState<Coordinate | null>(null);
  const [center, setCenter] = useState<[number, number] | undefined>(initialCenter);
  const [zoom, setZoom] = useState<[number] | undefined>(undefined);

  useEffect(() => {
    if (highlighted && highlighted.length === 1) {
      setPopupInfo({...highlighted[0]});
      setCenter([
        highlighted[0].longitude,
        highlighted[0].latitude,
      ]);
      setZoom([20]);
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
    const color = highlighted && highlighted[0] && highlighted[0].id === point.id
      ? secondaryColor : primaryColor;
    return (
      <Feature
        coordinates={[point.longitude, point.latitude]}
        onClick={onClick}
        onMouseEnter={(event: any) => togglePointer(event.map, 'pointer')}
        onMouseLeave={(event: any) => togglePointer(event.map, '')}
        properties={{
          'circle-color': color,
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
        setHighlighted={setHighlighted}
        setPopupInfo={setPopupInfo}
      />
    );
  };

  const geoJsonClusterData = {
    type: 'FeatureCollection',
    features: coordinates.map(coord => ({
      type: 'Feature',
      properties: {
        gqlId: coord.id,
      },
      geometry: {
        coordinates: [coord.longitude, coord.latitude],
      },
    })),
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
        movingMethod={'jumpTo'}
        zoom={zoom}
        key={`mapkey`}
      >
        <ZoomControl />
        <RotationControl style={{ top: 80 }} />
        <GeoJSONLayer
          id='source_id'
          data={geoJsonClusterData}
          sourceOptions={{
            cluster: true,
            clusterMaxZoom: 11,
            clusterRadius: 50,
          }}
        />
        <Layer
          id='cluster_count'
          sourceId='source_id'
          maxZoom={12}
          layerOptions={{
            filter: [
              'has', 'point_count',
            ],
          }}
          paint={{
            'circle-color': {
              property: 'point_count',
              type: 'interval',
              stops: [
                [0, primaryColor],
                [100, primaryColor],
                [750, primaryColor],
              ],
            },
            'circle-radius': {
              property: 'point_count',
              type: 'interval',
              stops: [
                [0, 15],
                [100, 23],
                [750, 32],
              ],
            },
          }}
          type='circle'
        />
        <Layer
          type='symbol'
          id={'clustered_text'}
          sourceId='source_id'
          layout={{
            'text-field': '{point_count}',
            'text-font': [
              'DIN Offc Pro Medium',
              'Arial Unicode MS Bold',
            ],
            'text-size': 12,
          }}
          paint={{
            'text-color': '#fff',
          }}
          layerOptions={{
            filter: ['has', 'point_count'],
          }}
        />
        <Layer
          type='circle'
          id='marker'
          minZoom={12}
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

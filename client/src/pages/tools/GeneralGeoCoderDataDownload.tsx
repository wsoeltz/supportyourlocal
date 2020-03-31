import { useMutation, useQuery } from '@apollo/react-hooks';
import axios from 'axios';
import csv from 'csvtojson';
import gql from 'graphql-tag';
import React, {useEffect, useState} from 'react';
import styled from 'styled-components/macro';
import {
  Business,
} from '../../graphQLTypes';
import { Content } from '../../styling/Grid';
import { primaryColor } from '../../styling/styleUtils';
import {getDistanceFromLatLonInMiles} from '../../Utils';

const Root = styled.div`
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Input = styled.input`
  width: 600px;
  font-size: 1rem;
  padding: 0.5rem;
  margin-bottom: 1rem;
`;

const SubmitButton = styled.button`
  padding: 0.7rem 1rem;
  text-transform: uppercase;
  color: #fff;
  background-color: ${primaryColor};
`;

const GET_ALL_BUSINESSES = gql`
  query ListBusinesses {
    businesses {
      id
      name
      latitude
      longitude
    }
  }
`;

interface SuccessResponse {
  businesses: Array<{
    id: Business['id'];
    name: Business['name'];
    latitude: Business['latitude'];
    longitude: Business['longitude'];
  }>;
}

const ADD_BUSINESS = gql`
  mutation AddBusiness(
    $externalId: String,
    $source: String,
    $name: String!,
    $address: String!,
    $city: String,
    $country: String!,
    $email: String,
    $website: String,
    $secondaryUrl: String,
    $logo: String,
    $images: [String!],
    $industry: String,
    $description: String,
    $latitude: Float!,
    $longitude: Float!,
  ) {
    business: addBusiness(
      externalId: $externalId,
      source: $source,
      name: $name,
      address: $address,
      city: $city,
      country: $country,
      email: $email,
      website: $website,
      secondaryUrl: $secondaryUrl,
      logo: $logo,
      images: $images,
      industry: $industry,
      description: $description,
      latitude: $latitude,
      longitude: $longitude,
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
      description
      latitude
      longitude
    }
  }
`;

interface Variables {
  externalId: string | null;
  source: string | null;
  name: string;
  address: string;
  city: string | null;
  country: string | null;
  email: string | null;
  website: string | null;
  secondaryUrl: string | null;
  logo: string | null;
  images: string[] | null;
  industry: string | null;
  latitude: number;
  longitude: number;
}

interface BusinessRaw {
  externalId: string;
  source: string;
  name: string;
  address: string;
  city: string;
  country: string;
  email: string;
  website: string;
  secondaryUrl: string;
  logo: string;
  images: string;
  industry: string;
  latitude: string;
  longitude: string;
}

const GeneralGeoCoderDataDownload = () => {

  const [url, setUrl] = useState<string>('');
  const [key, setKey] = useState<string>('');
  const [data, setData] = useState<Variables[] | undefined>(undefined);

  const {data: graphqlData} = useQuery<SuccessResponse>(GET_ALL_BUSINESSES);

  let isDataClean: boolean;
  if (key === process.env.REACT_APP_SECRET_DATA_UPLOAD_KEY && data) {
    isDataClean = true;
  } else {
    isDataClean = false;
  }

  const [addBusiness] = useMutation<{business: Business}, Variables>(ADD_BUSINESS);

  useEffect(() => {
    const cleanData = (rawData: BusinessRaw[]) => {
      if (graphqlData && graphqlData.businesses) {
        const cleanedData: Variables[] = [];
        rawData.forEach(datum => {
          const {
            externalId,
            source,
            name,
            address,
            city,
            country,
            email,
            website,
            secondaryUrl,
            logo,
            images,
            industry,
            latitude,
            longitude,
          } = datum;
          const exists = graphqlData.businesses.find(gqlDatum => {
            const distance = getDistanceFromLatLonInMiles({
              lat1: parseFloat(latitude),
              lon1: parseFloat(longitude),
              lat2: gqlDatum.latitude,
              lon2: gqlDatum.longitude,
            });
            if (gqlDatum.name === name && distance < 0.05) {
              return true;
            } else {
              return false;
            }
          });
          if (!exists) {
            cleanedData.push({
              externalId: externalId && externalId.length ? externalId : null,
              source: source && source.length ? externalId : null,
              name,
              address,
              city: city && city.length ? city : null,
              country: country && country.length ? country : null,
              email: email && email.length ? email : null,
              website: website && website.length ? website : null,
              secondaryUrl: secondaryUrl && secondaryUrl.length ? secondaryUrl : null,
              logo: logo && logo.length ? logo : null,
              images: images && images.length ? [images] : null,
              industry: industry && industry.length ? industry : null,
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
            });
          }
        });
        setData(cleanedData);
      }
    };
    const getCSVData = async () => {
      try {
        console.log(url);
        if (url && url.length) {
          console.log('has url');
          const res = await axios.get(url);
          if (res && res.data) {
            csv().fromString(res.data).then((json: BusinessRaw[]) => cleanData(json));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    getCSVData();

  }, [url, graphqlData]);

  const addAllData = () => {
    if (data) {
      data.forEach(datum => {
        addBusiness({ variables: {...datum}});
      });
    }
  };

  const submitButton = isDataClean ? (
    <SubmitButton onClick={addAllData}>Add Data</SubmitButton>
  ) : null;

  return (
    <Content>
      <Root>
        <h1>Data Upload</h1>
        <Input
          type='text'
          placeholder='URL'
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <Input
          type='password'
          placeholder='Key'
          value={key}
          onChange={e => setKey(e.target.value)}
        />
        {submitButton}
      </Root>
    </Content>
  );
};

export default GeneralGeoCoderDataDownload;

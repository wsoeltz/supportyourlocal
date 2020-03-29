import { useMutation } from '@apollo/react-hooks';
import csv from 'csvtojson';
import gql from 'graphql-tag';
import raw from 'raw.macro';
import React, {useEffect, useState} from 'react';
import {
  Business,
} from '../../graphQLTypes';
import { Content } from '../../styling/Grid';

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
  country: string;
  email: string | null;
  website: string | null;
  secondaryUrl: string | null;
  logo: string | null;
  images: string[] | null;
  industry: string;
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
  const [data, setData] = useState<BusinessRaw[] | undefined>(undefined);

  const [addBusiness] = useMutation<{business: Business}, Variables>(ADD_BUSINESS);

  useEffect(() => {

    const csvData = raw('./data/_20190328/datadump.csv');
    csv().fromString(csvData).then((res: BusinessRaw[]) => setData(res));

  }, []);

  const addAllData = () => {
    if (data) {
      data.forEach(datum => {
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
        addBusiness({ variables: {
          externalId: externalId.length ? externalId : null,
          source: source.length ? externalId : null,
          name,
          address,
          city: city.length ? city : null,
          country,
          email: email.length ? email : null,
          website: website.length ? website : null,
          secondaryUrl: secondaryUrl.length ? secondaryUrl : null,
          logo,
          images: images.length ? [images] : null,
          industry,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        }});
      });
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Content>
      GeneralGeoCoderDataDownload
      <button onClick={addAllData}>Add Data</button>
    </Content>
  );
};

export default GeneralGeoCoderDataDownload;

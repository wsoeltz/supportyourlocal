/**********************************
Use this page for manual gathering of the data from first voucher

1) Run this code, and in the browse navigate to /firstvoucherdatadownload
2) Download the first voucher code as a csv
3) Bulk geocode the data at https://geocode.xyz/
4) Download the final data set and place in the /data directory
5) Read in the CSV and convert it to JSON
6) Combine the finals, manually geocode the missed locations
7) Add the data to the database
**********************************/

import { useMutation, useQuery } from '@apollo/react-hooks';
import axios from 'axios';
import csv from 'csvtojson';
import gql from 'graphql-tag';
import raw from 'raw.macro';
import React, {useEffect, useState} from 'react';
import { CSVLink } from 'react-csv';
import {
  Business,
  Source,
} from '../../graphQLTypes';
import { Content } from '../../styling/Grid';

const GET_ALL_BUSINESSES = gql`
  query ListBusinesses {
    businesses {
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

interface SuccessResponse {
  businesses: Business[];
}

const ADD_BUSINESS = gql`
  mutation AddBusiness(
    $externalId: String,
    $source: String,
    $name: String!,
    $address: String!,
    $city: String!,
    $country: String!,
    $email: String!,
    $website: String,
    $secondaryUrl: String,
    $logo: String,
    $images: [String!],
    $industry: String!,
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
      latitude
      longitude
    }
  }
`;

interface BusinessRaw {
  externalId: string;
  source: Source.firstvoucher;
  name: string;
  address: string;
  city: string;
  country: string;
  email: string;
  website: string | null;
  secondaryUrl: string | null;
  logo: string | null;
  images: string[] | null;
  industry: string;
  latitude: number;
  longitude: number;
}

interface FirstVoucherResponseDatum {
  address: string;
  contact: string;
  contactCompany: string;
  email: string;
  salesCount: number;
  id: string;
  title: string;
  url: string;
  website: string;
  logo: string;
  background: string;
  city: string;
  industry: string;
  fullAddress: string;
}

interface FirstVoucherAdjustedDatum {
  id: string;
  address: string;
}

interface LatLongData {
  id: string;
  country: string;
  latitude: number;
  longitude: number;
}

const FirstVoucherDataDownload = () => {

  const [firstVoucherData, setFirstVoucherData] = useState<FirstVoucherAdjustedDatum[] | undefined>(undefined);
  const [completeData, setCompleteData] = useState<FirstVoucherResponseDatum[] | undefined>(undefined);
  const [latLongData, setLatLongData] = useState<LatLongData[] | undefined>(undefined);

  const {loading, error, data: graphqlData} = useQuery<SuccessResponse>(GET_ALL_BUSINESSES);

  const [addBusiness] = useMutation<{business: Business}, BusinessRaw>(ADD_BUSINESS, {
    update: (cache, { data: successData }) => {
      const response: SuccessResponse | null = cache.readQuery({ query: GET_ALL_BUSINESSES });
      if (response !== null && response.businesses !== null && successData) {
        cache.writeQuery({
          query: GET_ALL_BUSINESSES,
          data: { businesses: response.businesses.concat([successData.business]) },
        });
      }
    },
  });

  const listOfBusinesses = !loading && !error && graphqlData
    ? graphqlData.businesses.map(business => {
      return (
        <div key={business.id}>
          <p>
            <strong>{business.name}</strong>
            <br />{business.address}
            <br />{business.latitude}
            <br />{business.longitude}
            <br />{business.logo}
            <br />{business.website}
            <br />{business.email}
          </p>
        </div>
      );
    }) : null;

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get('https://syl.firstvoucher.com/api/merchant?offset=0&limit=1000&extended=true');
      if (res && res.data && graphqlData && graphqlData.businesses) {
        const appendedData: FirstVoucherAdjustedDatum[] = [];
        res.data.forEach((d: FirstVoucherResponseDatum) => {
          if (d && d.address && d.id) {
            if (!graphqlData.businesses.find(
              ({externalId, source}) => source === Source.firstvoucher && externalId === d.id)
            ) {
              appendedData.push({id: d.id, address: d.address});
            }
          }
        });
        setFirstVoucherData(appendedData);
        setCompleteData(res.data);
      }
    };
    fetchData();

    const geoCodedData = raw('./data/out_731491935FirstVoucherDataDownload2csv1585103589568961.csv');

    csv().fromString(geoCodedData).then(res => {
      const newLatLongData = res.map(row => {
        const id = row['Original Line'].split(',').shift();
        const country = row.StandardStateorProvinceAbbrv.split(', ').pop();
        return {
          id,
          latitude: parseFloat(row.Latitude),
          longitude: parseFloat(row.Longitude),
          country,
        };
      });
      setLatLongData(newLatLongData);
    });

  }, [graphqlData]);
  console.log(firstVoucherData);

  let downloadDataButton: React.ReactElement<any> | null;
  if (firstVoucherData) {
    downloadDataButton = (
      <CSVLink
        data={firstVoucherData}
        filename={'FirstVoucherDataDownload.csv'}
      >
        Download Data
      </CSVLink>
    );
  } else {
    downloadDataButton = null;
  }

  const outputData: BusinessRaw[] = [];
  const missingData: FirstVoucherResponseDatum[] = [];

  if (latLongData && latLongData.length && completeData && completeData.length) {
    completeData.forEach(d => {
      const targetLatLong = latLongData.find(lld => lld.id === d.id);
      if (targetLatLong) {
        const images = d.background ? [d.background] : [];
        const industry = d.industry ? d.industry : 'Other';
        outputData.push({
          externalId: d.id,
          name: d.title,
          source: Source.firstvoucher,
          address: d.address,
          city: d.city,
          country: targetLatLong.country,
          email: d.email,
          website: d.website,
          secondaryUrl: d.url,
          logo: d.logo,
          images,
          industry,
          latitude: targetLatLong.latitude,
          longitude: targetLatLong.longitude,
        });
      } else {
        missingData.push(d);
      }
    });
  }

  const submitData = () => {
    if (outputData && outputData.length) {
      outputData.forEach(datum => {
        addBusiness({variables: {...datum}});
      });
    }
  };

  const submitDataButton = outputData.length ? (
    <button
      onClick={submitData}
    >
      Submit data to database
    </button>
  ) : null;

  let missingDataDownloadDataButton: React.ReactElement<any> | null;
  if (missingData && missingData.length) {
    const appendedMissingData = missingData.map((d: FirstVoucherResponseDatum) => {
      if (d && d.address && d.id) {
        return {id: d.id, address: d.address};
      } else {
        return {id: '', address: ''};
      }
    });
    missingDataDownloadDataButton = (
      <CSVLink
        data={appendedMissingData}
        filename={'FirstVoucherDataDownload-Missing.csv'}
      >
        Download Missing Data CSV
      </CSVLink>
    );
  } else {
    missingDataDownloadDataButton = null;
  }

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Content>
      FirstVoucherDataDownload
      <br />
      {downloadDataButton}
      <br />
      {missingDataDownloadDataButton}
      <br />
      {submitDataButton}
      <div>
        {listOfBusinesses}
      </div>
    </Content>
  );
};

export default FirstVoucherDataDownload;

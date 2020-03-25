/**********************************

Use this page for manual gathering of the data from first voucher

1) Run this code, and in the browse navigate to /firstvoucherdatadownload
2) Download the first voucher code as a csv
3) Bulk geocode the data at https://geocode.xyz/
4) Download the final data set



**********************************/


import React, {useEffect, useState} from 'react';
import { Content } from '../../styling/Grid';
import axios from 'axios';
import { CSVLink } from 'react-csv';

interface FirstVoucherResponseDatum {
  address: string,
  contact: string,
  contactCompany: string,
  email: string,
  salesCount: number,
  id: string,
  title: string,
  url: string,
  website: string,
  logo: string,
  background: string,
  city: string,
  industry: string,
  fullAddress: string,
}

interface FirstVoucherAdjustedDatum {
  id: string;
  address: string;
}

const FirstVoucherDataDownload = () => {

  const [data, setData] = useState<FirstVoucherAdjustedDatum[] | undefined>(undefined);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get('https://syl.firstvoucher.com/api/merchant?offset=0&limit=1000&extended=true');
      if (res && res.data) {
        const appendedData = res.data.map((d: FirstVoucherResponseDatum) => {
          if (d && d.address && d.id) {
            return {id: d.id, address: d.address + ', Germany'}
          } else {
            return {id: '', address: ''}
          }
        })
        setData(appendedData);
      }
    }
    fetchData();
  }, []);

  console.log(data);

  let downloadDataButton: React.ReactElement<any> | null;
  if (data) {
    downloadDataButton = (
      <CSVLink
        data={data}
        filename={'FirstVoucherDataDownload.csv'}
      >
        Download Data
      </CSVLink>
    );
  } else {
    downloadDataButton = null;
  }

  return (
    <Content>
      FirstVoucherDataDownload
      <br />
      {downloadDataButton}
    </Content>
  );
};

export default FirstVoucherDataDownload;
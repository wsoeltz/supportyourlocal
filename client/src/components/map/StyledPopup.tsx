import { useQuery } from '@apollo/react-hooks';
import { GetString } from 'fluent-react/compat';
import gql from 'graphql-tag';
import React from 'react';
import {
  Popup,
} from 'react-mapbox-gl';
import styled from 'styled-components/macro';
import {
  Business,
} from '../../graphQLTypes';
import {
  LinkButton,
  semiBoldFontBoldWeight,
} from '../../styling/styleUtils';
import LoaderSmall from '../general/LoaderSmall';

const Root = styled.div`
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

const PopupAddress = styled.div`
  grid-row: 3;
`;

const FIND_BUSINESS = gql`
  query FindBusiness(
    $id: ID!,
  ) {
    business(id: $id) {
      id
      name
      address
      website
      secondaryUrl
      logo
    }
  }
`;

interface SuccessResponse {
  business: {
    id: Business['id'];
    name: Business['name'];
    address: Business['address'];
    website: Business['website'];
    secondaryUrl: Business['secondaryUrl'];
    logo: Business['logo'];
  };
}

interface Variables {
  id: string;
}

interface Props {
  id: string;
  longitude: number;
  latitude: number;
  getFluentString: GetString;
  closePopup: () => void;
}

const StyledPopup = (props: Props) => {
  const {
    id, getFluentString, closePopup,
    longitude, latitude,
  } = props;

  const {loading, error, data} = useQuery<SuccessResponse, Variables>(FIND_BUSINESS, {
    variables: {id},
  });

  let output: React.ReactElement<any> | null;
  if (loading) {
    output = <LoaderSmall />;
  } else if (error) {
    console.error(error);
    output = null;
  } else if (data !== undefined) {
    const {
      business: {
        name, address, website,
        secondaryUrl, logo },
    } = data;
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
            data-clickout='website'
          >
            {getFluentString('ui-text-view-website')}
          </LinkButton>
        )
      : null;
    let secondaryLink: React.ReactElement<any> | null;
    if (secondaryUrl) {
      secondaryLink = (
        <LinkButton
          href={secondaryUrl}
          target='_blank'
          rel='noopener noreferrer'
          data-clickout='vouchershop'
        >
          {getFluentString('ui-text-visit-voucher-shop')}
        </LinkButton>
      );
    } else {
      secondaryLink = null;
    }
    output = (
      <>
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
      </>
    );
  } else {
    output = null;
  }

  return (
    <Popup
      coordinates={[longitude, latitude]}
    >
      <Root>
        <PopupContent>
          {output}
        </PopupContent>
        <ClosePopup onClick={closePopup}>×</ClosePopup>
      </Root>
    </Popup>
  );
};

export default StyledPopup;

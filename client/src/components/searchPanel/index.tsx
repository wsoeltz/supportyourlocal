import {
  faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GetString } from 'fluent-react/compat';
import {darken} from 'polished';
import React, {useContext} from 'react';
import styled from 'styled-components/macro';
import {
  AppLocalizationAndBundleContext,
} from '../../contextProviders/getFluentLocalizationContext';
import { Business } from '../../graphQLTypes';
import usePrevious from '../../hooks/usePrevious';
import { lightBorderColor } from '../../styling/styleUtils';

const Root = styled.div`
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-rows: 1fr;
  position: relative;
  z-index: 10;
`;

const ScrollContainer = styled.div`
  padding: 0 1rem;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
`;

const Card = styled.div`
  box-sizing: border-box;
  padding: 0.8rem 0 1.3rem;
  border-bottom: solid 1px ${lightBorderColor};
  position: relative;
`;

const TitleContainer = styled.div`
  display: grid;
  grid-column-gap: 0.5rem;
  padding-right: 1rem;
`;

const Title = styled.h4`
  font-size: 1rem;
  margin-top: 0;
  margin-bottom: 0.5rem;
`;

const Info = styled.p`
  font-size: 0.9rem;
  color: #666;
`;

const LinkContainer = styled.div`
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

const NoResults = styled.p`
  padding: 1rem;
  text-align: center;
  color: #666;
`;

const ShowOnMap = styled.button`
  position: absolute;
  top: 0.5rem;
  right: -0.4rem;
  background-color: transparent;
  color: #215890;
  font-size: 1rem;
`;

interface Props {
  loading: boolean;
  data: Business[];
  setHighlighted: (value: [Business]) => void;
}

const SearchPanel = (props: Props) => {
  const {data, loading, setHighlighted} = props;

  const {localization} = useContext(AppLocalizationAndBundleContext);
  const getFluentString: GetString = (...args) => localization.getString(...args);

  const prevData = usePrevious(data);

  const dataToUse = loading === true ? prevData : data;

  let content: React.ReactElement<any> | null;
  if (!dataToUse || !dataToUse.length) {
    content = (
      <NoResults>
        <em>{getFluentString('ui-text-no-results-for-location')}</em>
      </NoResults>
    );
  } else {
    const cards = dataToUse.map(d => {
      const {
        name, address, website,
        secondaryUrl, industry,
      } = d;
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
        secondaryLink = (
              <LinkButton
            href={secondaryUrl}
            target='_blank'
            rel='noopener noreferrer'
          >
            {getFluentString('ui-text-visit-voucher-shop')}
          </LinkButton>
        );
      } else {
        secondaryLink = null;
      }
      return (
        <Card key={d.id}>
          <TitleContainer>
            <Title>{name}</Title>
            <Info>
              {industry}
              <br />
              {address}
            </Info>
          </TitleContainer>
          <LinkContainer>
            {secondaryLink}
            {websiteLink}
          </LinkContainer>
          <ShowOnMap onClick={() => setHighlighted([d])}>
            <FontAwesomeIcon icon={faMapMarkerAlt} />
          </ShowOnMap>
        </Card>
      );
    });
    content = <ScrollContainer>{cards}</ScrollContainer>;
  }

  return (
    <Root>
      {content}
    </Root>
  );
};

export default SearchPanel;

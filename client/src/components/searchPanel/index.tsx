import React from 'react';
import styled from 'styled-components/macro';
import { Business, Source } from '../../graphQLTypes';
import usePrevious from '../../hooks/usePrevious';
import { lightBorderColor, tertiaryColor } from '../../styling/styleUtils';

const primaryColor = '#215890';

const Root = styled.div`
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-rows: 1fr;
  position: relative;
  z-index: 10;
`;

const ScrollContainer = styled.div`
  padding: 1rem;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
`;

const Card = styled.div`
  box-sizing: border-box;
  padding: 2rem 0;
  border-bottom: solid 1px ${lightBorderColor};
  background-color: #fff;

  &:hover {
    cursor: pointer;
    background-color: ${tertiaryColor};
  }
`;

const TitleContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  grid-column-gap: 0.5rem;
  margin-bottom: 0.85rem;
`;

const Title = styled.h4`
  font-size: 1.2rem;
  margin-top: 0;
  margin-bottom: 0.5rem;
`;

const LogoContainer = styled.div`
  width: 180px;
  display: flex;
  justify-content: flex-end;
`;

const Logo = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const LinkContainer = styled.div`
  display: grid;
  grid-auto-columns: 1fr;
  grid-auto-flow: column;
  grid-column-gap: 0.7rem;
`;

const LinkButton = styled.a`
  padding: 0.3rem 0.4rem;
  border: solid 1px ${primaryColor};
  color: ${primaryColor};
  text-decoration: none;
  text-transform: capitalize;
  text-align: center;
  font-size: 0.75rem;

  &:hover {
    background-color: ${primaryColor};
    color: #fff;
  }
`;

const NoResults = styled.p`
  padding: 1rem;
  text-align: center;
  color: #666;
`;

interface Props {
  loading: boolean;
  data: Business[];
  setHighlighted: (value: [Business]) => void;
}

const SearchPanel = (props: Props) => {
  const {data, loading, setHighlighted} = props;

  const prevData = usePrevious(data);

  const dataToUse = loading === true ? prevData : data;

  let content: React.ReactElement<any> | null;
  if (!dataToUse || !dataToUse.length) {
    content = (
      <NoResults>
        <em>Sorry, we couldn't find any results in this location</em>
      </NoResults>
    );
  } else {
    const cards = dataToUse.map(d => {
      const {
        name, source, address, email, website,
        secondaryUrl, logo,
      } = d;
      let logoImg: React.ReactElement<any> | null;
      if (logo) {
        if (logo.match(/\.(jpeg|jpg|gif|png)$/) !== null) {
          logoImg = <LogoContainer><Logo src={logo} alt={name} /></LogoContainer>;
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
      return (
        <Card onClick={() => setHighlighted([d])} key={d.id}>
          <TitleContainer>
            <div>
              <Title>{d.name}</Title>
              <p>{address}</p>
            </div>
            {logoImg}
          </TitleContainer>
          <LinkContainer>
            {secondaryLink}
            {websiteLink}
            <LinkButton href={'mailto:' + email}>email</LinkButton>
          </LinkContainer>
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

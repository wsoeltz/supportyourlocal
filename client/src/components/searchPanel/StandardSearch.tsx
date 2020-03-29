import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { debounce } from 'lodash';
import React, { useContext, useEffect, useRef } from 'react';
import styled from 'styled-components/macro';
import { AppContext } from '../../App';
import {
  borderRadius,
  lightBorderColor,
  secondaryColor,
  secondaryFont,
} from '../../styling/styleUtils';

const SearchContainer = styled.label`
  position: relative;
  display: flex;
`;

const magnifyingGlassSize = 1.5; // in rem
const magnifyingGlassSpacing = 0.5; // in rem

const SearchIcon = styled(FontAwesomeIcon)`
  position: absolute;
  top: 0;
  bottom: 0;
  margin: auto ${magnifyingGlassSpacing}rem;
  font-size: ${magnifyingGlassSize}rem;
  color: #b1bccb;
  cursor: pointer;
`;

const SearchBar = styled.input`
  width: 100%;
  padding: 8px 8px 8px ${magnifyingGlassSize + (magnifyingGlassSpacing * 2)}rem;
  box-sizing: border-box;
  border: solid 1px ${lightBorderColor};
  font-size: 1.2rem;
  font-weight: 300;
  border-radius: ${borderRadius}px;
  box-shadow: none;
  outline: none;
  font-family: ${secondaryFont};
  color: #001240;

  &::placeholder {
    font-family: ${secondaryFont};
    color: #b1bccb;
  }

  &:focus {
    border-color: ${secondaryColor};
  }
`;

interface Props {
  placeholder: string;
  setSearchQuery: (value: string) => void;
  initialQuery: string;
  focusOnMount: boolean;
}

const StandardSearch = (props: Props) => {
  const { placeholder, setSearchQuery, initialQuery, focusOnMount } = props;

  const searchEl = useRef<HTMLInputElement | null>(null);
  const { windowWidth } = useContext(AppContext);

  const onChange = debounce(() => {
    if (searchEl !== null && searchEl.current !== null) {
      setSearchQuery(searchEl.current.value);
    }
  }, 400);

  useEffect(() => {
    const node = searchEl.current;
    if (node) {
      if (focusOnMount === true && windowWidth > 1024) {
        node.focus();
      }
      if (!node.value) {
        node.value = initialQuery;
      }
    }
  }, [searchEl, focusOnMount, windowWidth, initialQuery]);

  return (
    <SearchContainer>
      <SearchIcon icon='search' />
      <SearchBar
        ref={searchEl}
        type='text'
        placeholder={placeholder}
        onChange={onChange}
        autoComplete={'off'}
      />
    </SearchContainer>
  );
};

export default StandardSearch;

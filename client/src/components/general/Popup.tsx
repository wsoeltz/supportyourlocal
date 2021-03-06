import React from 'react';
import styled from 'styled-components/macro';
import {
  borderRadius,
} from '../../styling/styleUtils';

const Root = styled.div`
  position: absolute;
  padding: 1rem;
  box-sizing: border-box;
  max-width: 100%;
  z-index: 100;
`;
const Content = styled.div`
  box-sizing: border-box;
  background-color: #fff;
  box-shadow: 0px 1px 5px 0px #b5b5b5;
  position: relative;
  border-radius: ${borderRadius}px;
  overflow: hidden;
`;
const DismissButton = styled.button`
  position: absolute;
  top: 1px;
  right: 1px;
  font-size: 2rem;
  color: #666;
  padding: 0 0.5rem;;
  box-sizing: border-box;
  border-radius: ${borderRadius}px;
  background-color: transparent;
`;

interface Props {
  top?: string | number;
  bottom?: string | number;
  left?: string | number;
  right?: string | number;
  width?: string | number;
  backgroundColor?: string;
  children: React.ReactNode;
  onDismiss: () => void;
}

const Popup = (props: Props) => {
  const {
    top, bottom, left, right, width, children, onDismiss,
    backgroundColor,
  } = props;
  return (
    <Root
      style={{top, bottom, left, right, width}}
    >
      <Content style={{backgroundColor}}>
        {children}
        <DismissButton onClick={onDismiss}>
          ×
        </DismissButton>
      </Content>
    </Root>
  );
};

export default Popup;

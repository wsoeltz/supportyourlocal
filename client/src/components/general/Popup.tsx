import React from 'react';
import styled from 'styled-components/macro';
import {
  borderRadius,
} from '../../styling/styleUtils';

const Root = styled.div`
  position: absolute;
  padding: 1rem;
  box-sizing: border-box;
  border-radius: ${borderRadius}px;
  max-width: 100%;
  z-index: 100;
`;
const Content = styled.div`
  padding: 1.5rem;
  box-sizing: border-box;
  background-color: #fff;
  box-shadow: 0px 1px 5px 0px #b5b5b5;
  position: relative;
`;
const DismissButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  font-size: 1.5rem;
  color: #666;
  padding: 0.5rem;
  box-sizing: border-box;
`;

interface Props {
  top?: string | number;
  bottom?: string | number;
  left?: string | number;
  right?: string | number;
  width?: string | number;
  children: React.ReactNode;
  onDismiss: () => void;
}

const Popup = (props: Props) => {
  const {
    top, bottom, left, right, width, children, onDismiss,
  } = props;
  return (
    <Root
      style={{top, bottom, left, right, width}}
    >
      <Content>
        {children}
        <DismissButton onClick={onDismiss}>
          ×
        </DismissButton>
      </Content>
    </Root>
  );
};

export default Popup;

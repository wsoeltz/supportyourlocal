import React from 'react';
import styled, {keyframes} from 'styled-components/macro';

const baseSize = 30; // inp x

const Ring = styled.div`
  display: inline-block;
  position: relative;
  width: ${baseSize}px;
  height: ${baseSize}px;
`;
const animation = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const ChildBase = styled.div<{themeColor: string | undefined}>`
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: ${baseSize * 0.8}px;
  height: ${baseSize * 0.8}px;
  margin: ${baseSize * 0.1}px;
  border: ${baseSize * 0.1}px solid ${({themeColor}) => themeColor ? themeColor : '#bebebe'};
  border-radius: 50%;
  animation: ${animation} 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: ${({themeColor}) => themeColor ? themeColor : '#bebebe'} transparent transparent transparent;
`;

const FirstChild = styled(ChildBase)`
  animation-delay: -0.45s;
`;
const SecondChild = styled(ChildBase)`
  animation-delay: -0.3s;
`;
const ThirdChild = styled(ChildBase)`
  animation-delay: -0.15s;
`;

interface Props {
  color?: string;
}

const Loading = (props: Props) => {
  const {color} = props;
  return (
    <Ring>
      <FirstChild themeColor={color}></FirstChild>
      <SecondChild themeColor={color}></SecondChild>
      <ThirdChild themeColor={color}></ThirdChild>
      <ChildBase themeColor={color}></ChildBase>
    </Ring>
  );
};

export default Loading;

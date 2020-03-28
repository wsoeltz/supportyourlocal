import React from 'react';
import styled, {keyframes} from 'styled-components/macro';

const Ring = styled.div`
  display: inline-block;
  position: relative;
  width: 40px;
  height: 40px;
`;
const animation = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const ChildBase = styled.div`
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 32px;
  height: 32px;
  margin: 4px;
  border: 4px solid #bebebe;
  border-radius: 50%;
  animation: ${animation} 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: #bebebe transparent transparent transparent;
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

const Loading = () => {
  return (
    <Ring>
      <FirstChild></FirstChild>
      <SecondChild></SecondChild>
      <ThirdChild></ThirdChild>
      <ChildBase></ChildBase>
    </Ring>
  );
};

export default Loading;

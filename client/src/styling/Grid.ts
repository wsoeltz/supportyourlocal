import styled from 'styled-components/macro';

const gridLines = {
  // Horizontal Grid Lines
  pageTop: 'countryToolsGlobalGridPageTop',
  pageBottom: 'countryToolsGlobalGridPageBottom',
  // Vertical Grid Lines
  pageLeft: 'countryToolsGlobalGridPageLeft',
  pageRight: 'countryToolsGlobalGridPageRight',
};

export const Root = styled.div`
  display: grid;
  height: 100vh;
  grid-template-rows:
    [${gridLines.pageTop} ${gridLines.pageBottom}] 1fr;

  grid-template-columns:
    [${gridLines.pageLeft} ${gridLines.pageRight}] 1fr;
`;

export const Content = styled.main`
  grid-row: ${gridLines.pageTop} / ${gridLines.pageBottom};
  grid-column: ${gridLines.pageLeft} / ${gridLines.pageRight};
`;

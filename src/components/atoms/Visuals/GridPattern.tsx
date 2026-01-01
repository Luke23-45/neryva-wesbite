import styled from 'styled-components';

const GridContainer = styled.div`
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
  z-index: 0;
  mask-image: radial-gradient(circle at 50% 50%, black, transparent 80%);
`;

export const GridPattern = () => {
    return <GridContainer aria-hidden="true" />;
};

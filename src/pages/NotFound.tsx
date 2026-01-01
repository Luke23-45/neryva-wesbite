import styled from 'styled-components';

const PageContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.pageGutter};
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing[20]};
`;

const NotFound = () => <PageContainer><h1>404 Not Found</h1></PageContainer>;
export default NotFound;

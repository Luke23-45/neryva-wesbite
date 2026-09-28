import styled from 'styled-components';

export const Shell = styled.div`
  flex: 1;
  /* Fixed-viewport chain: the builder column fills the bounded ContentArea
     exactly; the old 560px floor would force the page taller than the
     viewport on short screens. */
  min-height: 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const Main = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
  /* The three columns (palette / canvas / inspector) own their scroll;
     the page never does. */
  overflow: hidden;

  ${({ theme }) => theme.media.tablet} {
    flex-direction: column;
  }
`;

export const NotFound = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 24px;
  text-align: center;
`;

export const NotFoundTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: 650;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const NotFoundBody = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.muted};
  max-width: 420px;
  line-height: 1.6;
`;

export const LoadingVeil = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.app.text.muted};
  font-size: ${({ theme }) => theme.app.type.body};
`;

import styled from 'styled-components';

export const HealthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin: 16px 0 20px;
`;

export const HealthCard = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 12px;
  padding: 12px 14px;
  background: ${({ theme }) => theme.app.bg.raised};
`;

export const HealthCount = styled.div`
  font-size: 22px;
  font-weight: 650;
  color: ${({ theme }) => theme.app.text.primary};
  font-variant-numeric: tabular-nums;
`;

export const HealthLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.secondary};
  margin-top: 2px;
`;

export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 650;
  color: ${({ theme }) => theme.app.text.primary};
  margin: 20px 0 10px;
`;

export const QueueList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const QueueRow = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 12px;
  padding: 10px 14px;
  background: ${({ theme }) => theme.app.bg.raised};
`;

export const QueueMain = styled.div`
  flex: 1;
  min-width: 0;
`;

export const QueueName = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const QueueDetail = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.secondary};
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const AsideGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  margin-top: 20px;
`;

export const AsideCard = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 12px;
  padding: 12px 14px;
  background: ${({ theme }) => theme.app.bg.raised};
`;

export const AsideTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 650;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const AsideBody = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.secondary};
  margin-top: 4px;
  line-height: 1.55;
`;

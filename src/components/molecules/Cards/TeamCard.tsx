import styled from 'styled-components';

interface TeamCardProps {
    name: string;
    role: string;
    department: string;
    image: string;
    bio?: string;
    socials?: { linkedin?: string; twitter?: string; github?: string };
}

const Card = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[6]};
  
  &:hover img {
    border-color: ${({ theme }) => theme.colors.accent.tealLight};
    box-shadow: 0 0 20px ${({ theme }) => theme.colors.accent.teal + '40'};
  }
`;

const TeamImage = styled.img`
  width: 160px;
  height: 160px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid ${({ theme }) => theme.colors.accent.teal};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  transition: all 0.3s ease;
  background-color: ${({ theme }) => theme.colors.surface};
`;

const TeamName = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const TeamRole = styled.p`
  color: ${({ theme }) => theme.colors.accent.teal};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const TeamDepartment = styled.p`
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

export const TeamCard = ({ name, role, department, image }: TeamCardProps) => {
    return (
        <Card>
            <TeamImage src={image} alt={name} />
            <TeamName>{name}</TeamName>
            <TeamRole>{role}</TeamRole>
            <TeamDepartment>{department}</TeamDepartment>
        </Card>
    );
};

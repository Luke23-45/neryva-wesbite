import { StyledPageHeader, PageTitle, PageDescription } from './PageHeader.styles';

interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <StyledPageHeader>
      <PageTitle>{title}</PageTitle>
      {description && <PageDescription>{description}</PageDescription>}
    </StyledPageHeader>
  );
}

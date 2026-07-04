import { ArrowRight } from 'lucide-react';
import ctaData from '@neryva_data/home/sections/cta.json';
import {
  CtaWrapper,
  CtaPanel,
  Label,
  Title,
  Description,
  CtaAction
} from './HomeCta.styles';

export function HomeCta() {
  return (
    <CtaWrapper>
      {/* Left Panel: Enterprise/Commercial (Dark Theme) */}
      <CtaPanel to={ctaData.enterprise.href} $isDark>
        <Label $isDark>{ctaData.enterprise.label}</Label>
        <Title>{ctaData.enterprise.title}</Title>
        <Description $isDark>{ctaData.enterprise.description}</Description>
        <CtaAction $isDark>
          {ctaData.enterprise.ctaText}
          <ArrowRight size={20} strokeWidth={2} />
        </CtaAction>
      </CtaPanel>

      {/* Right Panel: Engineers/Technical (Light Theme) */}
      <CtaPanel to={ctaData.technical.href}>
        <Label>{ctaData.technical.label}</Label>
        <Title>{ctaData.technical.title}</Title>
        <Description>{ctaData.technical.description}</Description>
        <CtaAction>
          {ctaData.technical.ctaText}
          <ArrowRight size={20} strokeWidth={2} />
        </CtaAction>
      </CtaPanel>
    </CtaWrapper>
  );
}

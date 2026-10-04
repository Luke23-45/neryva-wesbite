import { Link, useParams } from '@tanstack/react-router';
import styled from 'styled-components';
import { ArrowLeft, Building2 } from 'lucide-react';
import { PageHead } from '@components/common/PageHead';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { useOrgTier } from '@/sections/pages/products/agent-studio/providers/hooks/useOrgTier';
import { CustomProviderForm } from '@/sections/pages/products/agent-studio/providers/custom/CustomProviderForm';

const GatePanel = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 16px;
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: 36px;
  max-width: 560px;
  margin: 32px auto;
  text-align: center;
`;

const GateIcon = styled.span`
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.app.status.info.bg};
  color: ${({ theme }) => theme.app.text.link};
  margin-bottom: 16px;
`;

const GateTitle = styled.h2`
  font-size: 20px;
  font-weight: 650;
  margin: 0 0 10px;
  color: ${({ theme }) => theme.app.text.primary};
`;

const GateCopy = styled.p`
  font-size: 14px;
  line-height: 1.65;
  color: ${({ theme }) => theme.app.text.secondary};
  margin: 0 0 20px;
`;

const GateActions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
`;

const GateLink = styled(Link)<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid
    ${({ theme, $primary }) => ($primary ? 'transparent' : theme.app.border.strong)};
  background: ${({ theme, $primary }) => ($primary ? theme.app.text.link : 'transparent')};
  color: ${({ theme, $primary }) =>
    $primary ? theme.app.text.inverse : theme.app.text.primary};
  &:hover {
    opacity: 0.92;
  }
`;

const BackRow = styled.div`
  margin-bottom: 8px;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.secondary};
  text-decoration: none;
  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
  }
`;

/**
 * /agent-studio/providers/custom/new and /custom/$credentialId/edit.
 *
 * Enterprise gate: non-enterprise orgs see an honest upgrade page — direct
 * sales contact, and a way back, never a dead end. The server enforces the
 * same gate at create/update (E-3); this page is the client-side mirror.
 */
export default function AgentStudioProvidersCustomPage() {
  const tier = useOrgTier();
  // Shared by both routes; undefined on /custom/new (create mode).
  const params = useParams({ strict: false });
  const credentialId = (params as { credentialId?: string }).credentialId;

  const pageTitle = credentialId ? 'Edit custom provider' : 'Connect custom provider';

  if (tier !== 'enterprise') {
    return (
      <>
        <PageHead
          title={pageTitle}
          description="Custom inference endpoints are an Enterprise feature."
          canonicalPath={
            credentialId
              ? `/agent-studio/providers/custom/${credentialId}/edit`
              : '/agent-studio/providers/custom/new'
          }
        />
        <ViewShell>
          <BackRow>
            <BackLink to="/agent-studio/providers">
              <ArrowLeft size={15} aria-hidden="true" />
              Back to Providers
            </BackLink>
          </BackRow>
          <GatePanel>
            <GateIcon aria-hidden="true">
              <Building2 size={24} />
            </GateIcon>
            <GateTitle>Custom endpoints are an Enterprise feature</GateTitle>
            <GateCopy>
              Connecting private inference endpoints — vLLM, TGI, Ollama clusters, or
              VPC gateways — needs enterprise egress controls, secure, hardened
              connection checks, and compliance attestations. Talk to our team
              and we'll get your workspace set up.
            </GateCopy>
            <GateActions>
              <GateLink to="/contact" $primary>
                Contact sales
              </GateLink>
              <GateLink to="/agent-studio/settings/pricing">View plans</GateLink>
            </GateActions>
          </GatePanel>
        </ViewShell>
      </>
    );
  }

  return (
    <>
      <PageHead
        title={pageTitle}
        description="Configure a custom inference endpoint with enterprise egress security."
        canonicalPath={
          credentialId
            ? `/agent-studio/providers/custom/${credentialId}/edit`
            : '/agent-studio/providers/custom/new'
        }
      />
      <ViewShell>
        <BackRow>
          <BackLink to="/agent-studio/providers">
            <ArrowLeft size={15} aria-hidden="true" />
            Back to Providers
          </BackLink>
        </BackRow>
        <ViewHeader>
          <ViewTitle>{pageTitle}</ViewTitle>
          <ViewSubtitle>
            Configure custom inference endpoints, private VPC gateways, or self-hosted
            LLMs (vLLM, TGI, Ollama) with enterprise egress security.
          </ViewSubtitle>
        </ViewHeader>
        <CustomProviderForm credentialId={credentialId} />
      </ViewShell>
    </>
  );
}

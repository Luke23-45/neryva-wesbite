/**
 * PUBLIC REGISTRY — Keyed by the section `id` from each section JSON.
 *
 * Lives apart from PipelineStepIcons.tsx (which exports only components) so
 * the icon module stays fast-refresh clean: components and the keyed
 * registries are separate exports in separate files.
 */
import {
  BusinessScopeIcon,
  BrandVoiceIcon,
  KnowledgeIcon,
  GuardrailsIcon,
  WorkflowIcon,
  OperationsIcon,
  ArchitectureIcon,
  ProvisioningIcon,
  ServingIcon,
  PerformanceIcon,
  MonitoringIcon,
  GovernanceIcon,
  SupportIcon,
} from './PipelineStepIcons';

export const EnterpriseStepIcons: Record<string, React.FC> = {
  'business-scope': BusinessScopeIcon,
  'brand-voice': BrandVoiceIcon,
  'knowledge-integration': KnowledgeIcon,
  'behavior-guardrails': GuardrailsIcon,
  'workflow-support': WorkflowIcon,
  'operations-testing': OperationsIcon,
};

export const DeploymentStepIcons: Record<string, React.FC> = {
  architecture: ArchitectureIcon,
  provisioning: ProvisioningIcon,
  serving: ServingIcon,
  performance: PerformanceIcon,
  monitoring: MonitoringIcon,
  governance: GovernanceIcon,
  support: SupportIcon,
};

import { motion } from 'framer-motion';
import { Globe2, Lock, ShieldCheck } from 'lucide-react';
import { StatusPill } from '@components/common/ui/StatusPill';
import network from '@neryva_data/products/deployment/network.json';
import {
  PageRoot,
  PageHeader,
  TitleBlock,
  PageTitle,
  PageSubtitle,
  SectionTitle,
  EndpointGrid,
  EndpointCard,
  EndpointTop,
  EndpointName,
  EndpointLabel,
  EndpointUrl,
  DetailGrid,
  DetailItem,
  DetailLabel,
  DetailValue,
  IpList,
  IpChip,
  VpcCard,
  VpcHeader,
  VpcMeta,
  VpcMetaItem,
  VpcMetaLabel,
  VpcMetaValue,
  VpcName,
  SubnetGrid,
  Subnet,
  SubnetLeft,
  SubnetName,
  SubnetCidr,
  Table,
  TableHead,
  TableRow,
  Th,
  Td,
  Mono,
  Pill,
  CdnCard,
  CdnMetric,
  CdnLabel,
  CdnValue,
} from './NetworkView.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: premiumEase, delay: i * 0.04 },
  }),
};

export function NetworkView() {
  return (
    <PageRoot>
      <PageHeader as={motion.div} initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <TitleBlock>
          <PageTitle>Network</PageTitle>
          <PageSubtitle>
            Endpoints, private networking, DNS records, and CDN configuration for the deployment
            surface.
          </PageSubtitle>
        </TitleBlock>
      </PageHeader>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <SectionTitle>
          <Globe2 size={14} strokeWidth={1.7} />
          Public endpoints
        </SectionTitle>
        <EndpointGrid>
          {network.endpoints.map((e, i) => (
            <EndpointCard
              key={e.id}
              as={motion.div}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={i + 2}
            >
              <EndpointTop>
                <EndpointName>
                  <EndpointLabel>
                    {e.name}
                    <StatusPill tone={e.tone as 'emerald' | 'azure' | 'neutral'}>
                      {e.status}
                    </StatusPill>
                  </EndpointLabel>
                  <EndpointUrl>{e.url}</EndpointUrl>
                </EndpointName>
              </EndpointTop>
              <DetailGrid>
                <DetailItem>
                  <DetailLabel>TLS</DetailLabel>
                  <DetailValue>{e.tlsVersion}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Certificate</DetailLabel>
                  <DetailValue>{e.certificate}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>CDN</DetailLabel>
                  <DetailValue>{e.cdn}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Rate limit</DetailLabel>
                  <DetailValue>{e.rateLimit}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>WAF</DetailLabel>
                  <DetailValue>{e.waf ? 'Enabled' : 'Disabled'}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>IPs</DetailLabel>
                  <IpList>
                    {e.ips.map((ip) => (
                      <IpChip key={ip}>{ip}</IpChip>
                    ))}
                  </IpList>
                </DetailItem>
              </DetailGrid>
            </EndpointCard>
          ))}
        </EndpointGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6}>
        <SectionTitle>
          <Lock size={14} strokeWidth={1.7} />
          VPC
        </SectionTitle>
        <VpcCard>
          <VpcHeader>
            <VpcName>{network.vpc.name}</VpcName>
            <VpcMeta>
              <VpcMetaItem>
                <VpcMetaLabel>CIDR</VpcMetaLabel>
                <VpcMetaValue>{network.vpc.cidr}</VpcMetaValue>
              </VpcMetaItem>
              <VpcMetaItem>
                <VpcMetaLabel>Region</VpcMetaLabel>
                <VpcMetaValue>{network.vpc.region}</VpcMetaValue>
              </VpcMetaItem>
              <VpcMetaItem>
                <VpcMetaLabel>Subnets</VpcMetaLabel>
                <VpcMetaValue>{network.vpc.subnets.length}</VpcMetaValue>
              </VpcMetaItem>
              <VpcMetaItem>
                <VpcMetaLabel>Peerings</VpcMetaLabel>
                <VpcMetaValue>{network.vpc.peerings.length}</VpcMetaValue>
              </VpcMetaItem>
            </VpcMeta>
          </VpcHeader>
          <SubnetGrid>
            {network.vpc.subnets.map((s) => (
              <Subnet key={s.id}>
                <SubnetLeft>
                  <SubnetName>{s.name}</SubnetName>
                  <SubnetCidr>{s.cidr}</SubnetCidr>
                </SubnetLeft>
                <Pill $tone={s.tone}>{s.zone}</Pill>
              </Subnet>
            ))}
          </SubnetGrid>
        </VpcCard>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={8}>
        <SectionTitle>DNS records</SectionTitle>
        <Table>
          <TableHead>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Value</Th>
            <Th>TTL</Th>
          </TableHead>
          {network.dns.map((d) => (
            <TableRow key={d.id}>
              <Td>
                <Mono>{d.name}</Mono>
              </Td>
              <Td>
                <Pill $tone={d.tone}>{d.type}</Pill>
              </Td>
              <Td>
                <Mono>{d.value}</Mono>
              </Td>
              <Td>
                <Mono>{d.ttl}s</Mono>
              </Td>
            </TableRow>
          ))}
        </Table>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={9}>
        <SectionTitle>
          <ShieldCheck size={14} strokeWidth={1.7} />
          CDN
        </SectionTitle>
        <CdnCard>
          <CdnMetric>
            <CdnLabel>Provider</CdnLabel>
            <CdnValue>{network.cdn.provider}</CdnValue>
          </CdnMetric>
          <CdnMetric>
            <CdnLabel>Cache hit rate</CdnLabel>
            <CdnValue style={{ color: '#34d399' }}>{network.cdn.cacheHitRate}%</CdnValue>
          </CdnMetric>
          <CdnMetric>
            <CdnLabel>Bandwidth saved</CdnLabel>
            <CdnValue>{network.cdn.bandwidthSaved}</CdnValue>
          </CdnMetric>
          <CdnMetric>
            <CdnLabel>Edge POPs</CdnLabel>
            <CdnValue>{network.cdn.popRegions}</CdnValue>
          </CdnMetric>
        </CdnCard>
      </motion.div>
    </PageRoot>
  );
}

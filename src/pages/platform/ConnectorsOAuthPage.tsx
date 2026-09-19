/**
 * `/platform/org/:orgId/connectors?oauth=` — connector OAuth landing
 * (team_setup_ledger.md F-A8). Top-level route (like the invite page): the
 * provider redirects an anonymous browser at the engine callback, which 302s
 * here — guarded shells must never wrap it. All logic lives in
 * ConnectorOAuthSection; this file is helmet + section.
 */
import { Helmet } from 'react-helmet-async';
import { useSearch } from '@tanstack/react-router';
import { ConnectorOAuthSection } from '@/sections/pages/platform/connectors';

export default function ConnectorsOAuthPage() {
  const search = useSearch({ from: '/platform/org/$orgId/connectors' });
  return (
    <>
      <Helmet>
        <title>Connector authorization — Neryva</title>
        <meta name="description" content="Connector OAuth result for a Neryva workspace." />
        <meta name="referrer" content="no-referrer" />
      </Helmet>
      <ConnectorOAuthSection status={search.oauth} />
    </>
  );
}

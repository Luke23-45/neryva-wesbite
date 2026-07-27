import { PageHead } from '@components/common/PageHead';
import { EventsHero } from '@/sections/pages/resources/events/EventsHero/EventsHero';
import { EventsList } from '@/sections/pages/resources/events/EventsList/EventsList';
import eventsHero from '@neryva_data/events/sections/hero.json';
export default function EventsPage() {
  return (
    <>
      <PageHead
        title="Events"
        description="Experience the frontier. Join us for keynotes, deep-dive technical workshops, and community events."
        canonicalPath="/resources/events"
      />
      <main>
        <EventsHero data={eventsHero} />
        <EventsList />
      </main>
    </>
  );
}

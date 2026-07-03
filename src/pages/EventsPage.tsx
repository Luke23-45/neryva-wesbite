import { PageHead } from '@components/common/PageHead';
import { EventsHero } from '@/sections/events/EventsHero/EventsHero';
import { EventsList } from '@/sections/events/EventsList/EventsList';
import eventsData from '@/data/pages/events.json';

export default function EventsPage() {
  return (
    <>
      <PageHead
        title="Events"
        description="Experience the frontier. Join us for keynotes, deep-dive technical workshops, and community events."
        canonicalPath="/resources/events"
      />
      <main>
        <EventsHero data={eventsData.hero} />
        <EventsList data={eventsData.eventsList} />
      </main>
    </>
  );
}

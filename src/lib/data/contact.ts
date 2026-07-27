import type { ContactRoute } from '@types';
import contactRoutesData from '@neryva_data/contact/sections/routes.json';

export function getContactRoutes(): ContactRoute[] {
  const data = contactRoutesData as { items: Array<{ id: string; title: string; description: string; href: string; label: string }> };
  return data.items.map((item) => ({
    label: item.title,
    description: item.description,
    email: item.label,
  }));
}

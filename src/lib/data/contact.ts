import type { ContactRoute } from '@types';
import contactRoutesData from '@data/contact/routes.json';

export function getContactRoutes(): ContactRoute[] {
  return contactRoutesData as ContactRoute[];
}

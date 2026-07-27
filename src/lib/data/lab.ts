import type { LabMission, TeamMember, LabValue } from '@types';
import missionData from '@neryva_data/company/about/mission.json';
import teamData from '@neryva_data/company/about/team.json';
import valuesData from '@neryva_data/company/about/values.json';

export function getMission(): LabMission {
  return missionData;
}

export function getTeam(): TeamMember[] {
  const data = teamData as { items: Array<{ name: string; focus: string }> };
  return data.items.map((item) => ({
    name: item.name,
    role: '',
    bio: item.focus,
    links: {},
  }));
}

export function getValues(): LabValue[] {
  return (valuesData as { items: LabValue[] }).items;
}

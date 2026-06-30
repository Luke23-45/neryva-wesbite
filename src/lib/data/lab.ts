import type { LabMission, TeamMember, LabValue } from '@types';
import missionData from '@data/lab/mission.json';
import teamData from '@data/lab/team.json';
import valuesData from '@data/lab/values.json';

export function getMission(): LabMission {
  return missionData;
}

export function getTeam(): TeamMember[] {
  return teamData as TeamMember[];
}

export function getValues(): LabValue[] {
  return valuesData as LabValue[];
}

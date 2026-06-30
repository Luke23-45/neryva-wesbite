import type { ResearchAgenda, ActiveArea, OpenProblem, EarlyStageData, Paper, LatestWorkItem } from '@types';
import agendaData from '@data/research/agenda.json';
import activeAreasData from '@data/research/active-areas.json';
import papersData from '@data/research/papers.json';
import latestWorkData from '@data/research/latest-work.json';
import openProblemsData from '@data/research/open-problems.json';

export function getResearchAgenda(): ResearchAgenda {
  return agendaData;
}

export function getActiveAreas(): ActiveArea[] {
  return activeAreasData as ActiveArea[];
}

export function getPapers(): EarlyStageData<Paper> {
  return papersData as EarlyStageData<Paper>;
}

export function getLatestWork(): EarlyStageData<LatestWorkItem> {
  return latestWorkData as EarlyStageData<LatestWorkItem>;
}

export function getOpenProblems(): OpenProblem[] {
  return openProblemsData as OpenProblem[];
}

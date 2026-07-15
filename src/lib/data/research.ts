import type { ResearchAgenda, OpenProblem, EarlyStageData, Paper } from '@types';
import agendaData from '@neryva_data/research/sections/agenda.json';
import papersData from '@neryva_data/research/sections/papers.json';
import openProblemsData from '@neryva_data/research/sections/open_problems.json';

export function getResearchAgenda(): ResearchAgenda {
  return agendaData;
}

export function getPapers(): EarlyStageData<Paper> {
  return papersData as EarlyStageData<Paper>;
}

export function getOpenProblems(): OpenProblem[] {
  return openProblemsData as OpenProblem[];
}

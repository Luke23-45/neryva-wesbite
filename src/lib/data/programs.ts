import type { Program, ProgramDetail, ProgramPage } from '@types';
import programsIndex from '@data/programs/index.json';
import llmData from '@data/programs/large-language-models.json';
import roboticsData from '@data/programs/robotics-task-transfer.json';
import clinicalData from '@data/programs/clinical-ai.json';
import energyData from '@data/programs/energy-engineering-optimization.json';

// New page-level data
import llmPage from '@data/pages/program/large-language-models.json';
import roboticsPage from '@data/pages/program/robotics-task-transfer.json';
import clinicalPage from '@data/pages/program/clinical-ai.json';
import energyPage from '@data/pages/program/energy-engineering-optimization.json';

const programDetails: Record<string, ProgramDetail> = {
  'large-language-models': llmData as ProgramDetail,
  'robotics-task-transfer': roboticsData as ProgramDetail,
  'clinical-ai': clinicalData as ProgramDetail,
  'energy-engineering-optimization': energyData as ProgramDetail,
};

const programPages: Record<string, ProgramPage> = {
  'large-language-models': llmPage as ProgramPage,
  'robotics-task-transfer': roboticsPage as ProgramPage,
  'clinical-ai': clinicalPage as ProgramPage,
  'energy-engineering-optimization': energyPage as ProgramPage,
};

export function getPrograms(): Program[] {
  return programsIndex as Program[];
}

export function getProgramBySlug(slug: string): ProgramDetail | undefined {
  return programDetails[slug];
}

export function getProgramPage(slug: string): ProgramPage | undefined {
  return programPages[slug];
}

export function getProgramSlugs(): string[] {
  return Object.keys(programDetails);
}

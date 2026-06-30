import type { Program, ProgramDetail } from '@types';
import programsIndex from '@data/programs/index.json';
import llmData from '@data/programs/large-language-models.json';
import roboticsData from '@data/programs/robotics-task-transfer.json';
import clinicalData from '@data/programs/clinical-ai.json';
import energyData from '@data/programs/energy-engineering-optimization.json';

const programDetails: Record<string, ProgramDetail> = {
  'large-language-models': llmData as ProgramDetail,
  'robotics-task-transfer': roboticsData as ProgramDetail,
  'clinical-ai': clinicalData as ProgramDetail,
  'energy-engineering-optimization': energyData as ProgramDetail,
};

export function getPrograms(): Program[] {
  return programsIndex as Program[];
}

export function getProgramBySlug(slug: string): ProgramDetail | undefined {
  return programDetails[slug];
}

export function getProgramSlugs(): string[] {
  return Object.keys(programDetails);
}

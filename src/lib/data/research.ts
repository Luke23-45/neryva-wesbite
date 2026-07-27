import type { EarlyStageData, Paper } from '@types';
import papersData from '@neryva_data/research/sections/papers.json';




export function getPapers(): EarlyStageData<Paper> {
  return papersData as EarlyStageData<Paper>;
}



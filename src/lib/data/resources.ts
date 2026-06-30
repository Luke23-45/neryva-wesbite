import type { EarlyStageData, TechnicalWritingEntry, RepositoryEntry, ReadingListCluster } from '@types';
import technicalWritingData from '@data/resources/technical-writing.json';
import repositoriesData from '@data/resources/repositories.json';
import readingListsData from '@data/resources/reading-lists.json';

export function getTechnicalWriting(): EarlyStageData<TechnicalWritingEntry> {
  return technicalWritingData as EarlyStageData<TechnicalWritingEntry>;
}

export function getRepositories(): EarlyStageData<RepositoryEntry> {
  return repositoriesData as EarlyStageData<RepositoryEntry>;
}

export function getReadingLists(): ReadingListCluster[] {
  return readingListsData as ReadingListCluster[];
}

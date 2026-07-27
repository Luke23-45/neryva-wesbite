import type { EarlyStageData, TechnicalWritingEntry, RepositoryEntry, ReadingListCluster } from '@types';
import technicalWritingData from '@neryva_data/resources/sections/writing.json';
import repositoriesData from '@neryva_data/resources/sections/open_source.json';
import readingListsData from '@neryva_data/resources/sections/reading_lists.json';

export function getTechnicalWriting(): EarlyStageData<TechnicalWritingEntry> {
  return technicalWritingData as EarlyStageData<TechnicalWritingEntry>;
}

export function getRepositories(): EarlyStageData<RepositoryEntry> {
  return repositoriesData as EarlyStageData<RepositoryEntry>;
}

export function getReadingLists(): ReadingListCluster[] {
  return (readingListsData as { groups: ReadingListCluster[] }).groups;
}

/* eslint no-console: off */

import React, { useEffect, useState } from 'react';
import { Flex, Box } from '@chakra-ui/react';

import ProjectListView from './ProjectListView';
import TopBar from './TopBar';
import { useProjectState } from './ProjectContext';
import CenterView from './CenterView';
import LeftSidebar from './LeftSidebar';
import ArtifactDetailWindow from './ArtifactDetailWindow';
import ThreadView from './TheadView';
import ProjectTimelineView from './ProjectTimelineView';
import { EntryType } from './types';

interface ProjectProps {
  folderPath: string;
}

const Project = (ProjectPropValues: ProjectProps) => {
  const { folderPath } = ProjectPropValues;
  const [{ projectData, filterTags, filterTypes, filterDates }] = useProjectState();
  const [viewType, setViewType] = useState<string>('timeline');
  const [reversedOrder, setReversedOrder] = useState<boolean>(true);
  const [newTitle, setNewTitle] = useState<string>(projectData.title);
  const [timeFilter, setTimeFilter] = useState<any>(null);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(-1);
  const [filteredActivites, setFilteredActivites] = useState(projectData.entries);

  // Update title when projectData changes.
  useEffect(() => {
    setNewTitle(projectData.title);
  }, [projectData]);                                                                                                                                        

    // Update title when projectData changes.
    useEffect(() => {
      
      const tagFiltered = projectData.entries
      .filter((entryData: any) => {
        return filterTags.every((requiredTag: string) =>
          entryData.tags.includes(requiredTag)
        );
      })
      .map((e, index) => ({ ...e, index }));
  
      const typeFiltered = tagFiltered
        .filter((entryData: any) => {
          if (filterTypes && filterTypes.length > 0) {
            return entryData.files.map((m: any) => m.fileType).includes(filterTypes);
          } else {
            return entryData;
          }
        })
        .map((e: EntryType, index: number) => ({ ...e, index }));

      let timeFiltered =
      timeFilter != null
        ? typeFiltered.filter(
            (f) =>
              new Date(f.date) >= timeFilter[0] &&
              new Date(f.date) <= timeFilter[1]
          )
        : typeFiltered;
  
        timeFiltered.sort(
        (a, b) =>
          (reversedOrder ? -1 : +1) *
          (Number(new Date(a.date)) - Number(new Date(b.date)))
      );

      setFilteredActivites(timeFiltered);
    }, [projectData, filterTags, filterTypes, timeFilter]);

   

  if (viewType === 'activity view') {
    return (
      <div
        style={{
          height: '100vh',
          position: 'fixed',
          top: 0,
          bottom: 0,
          width: '100%',
        }}
      >
        <TopBar
          folderPath={folderPath}
          filteredActivites={filteredActivites}
          setViewType={setViewType}
          reversedOrder={reversedOrder}
          setReversedOrder={setReversedOrder}
          newTitle={newTitle}
          setNewTitle={setNewTitle}
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
        />
        <Flex position="relative" top={220}>
          <LeftSidebar />
          <CenterView
            projectEntries={projectData.entries}
            folderPath={folderPath}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
          />
          <Box flex="1.1" h="calc(100vh - 250px)" overflowY="auto">
            <ProjectListView
              projectData={projectData}
              filteredActivites={filteredActivites}
              setViewType={setViewType}
              timeFilter={timeFilter}
              setTimeFilter={setTimeFilter}
            />
          </Box>
        </Flex>
      </div>
    );
  }

  if (viewType === 'timeline') {
    return (
      <div
        style={{
          height: '100vh',
          position: 'fixed',
          top: 0,
          bottom: 0,
          width: '100%',
        }}
      >
        <TopBar
          folderPath={folderPath}
          viewType={viewType}
          setViewType={setViewType}
          reversedOrder={reversedOrder}
          setReversedOrder={setReversedOrder}
          newTitle={newTitle}
          setNewTitle={setNewTitle}
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
        />
        <Flex position="relative" top={220}>
          <LeftSidebar />
          <Box flex="3.5" h="calc(100vh - 250px)">
          <ProjectTimelineView 
            projectData={projectData}
            filteredActivites={filteredActivites}
            folderPath={folderPath}
            selectedEntryIndex={selectedEntryIndex} 
            setSelectedEntryIndex={setSelectedEntryIndex}
          />
          </Box>
          <Box flex="1.5" h="calc(100vh - 250px)" overflowY="auto">
            <ProjectListView
              projectData={projectData}
              filteredActivites={filteredActivites}
              setViewType={setViewType}
              selectedEntryIndex={selectedEntryIndex} 
              setSelectedEntryIndex={setSelectedEntryIndex}
            />
          </Box>
        </Flex>
      </div>
    );
  }

  if (viewType === 'research threads') {
    return (
      <div
        style={{
          height: '100vh',
          position: 'fixed',
          top: 0,
          bottom: 0,
          width: '100%',
        }}
      >
        <TopBar
          folderPath={folderPath}
          viewType={viewType}
          setViewType={setViewType}
          reversedOrder={reversedOrder}
          setReversedOrder={setReversedOrder}
          newTitle={newTitle}
          setNewTitle={setNewTitle}
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
        />

        <ThreadView />
      </div>
    );
  }

  if (viewType === 'detail view') {
    return (
      <ArtifactDetailWindow
        setViewType={setViewType}
        folderPath={folderPath}
        projectData={projectData}
      />
    );
  }
};

export default Project;

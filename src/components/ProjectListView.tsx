import path from 'path';
import React, { useState, useEffect } from 'react';
import { Button, ButtonGroup, Divider, Heading } from '@chakra-ui/react';
import { FaEye, FaEyeSlash, FaPlus } from 'react-icons/fa';

import { useProjectState } from './ProjectContext';
import { EntryType, FileObj, ProjectViewProps } from './types';
import Entry from './Entry';
import FileUpload from './FileUpload';
import TagList from './TagList';
import TagFilter from './SetFilterTags';
import ReadonlyEntry from './ReadonlyEntry';
import ConceptNav from './concepts';
import EdgeControl from './Edges';

const { ipcRenderer } = require('electron');

const ProjectListView = (ProjectPropValues: ProjectViewProps) => {
  const { projectData, folderPath } = ProjectPropValues;

  const [{ filterTags }, dispatch] = useProjectState();
  
  const [editable, setEditable] = useState<boolean[]>(
    Array.from(Array(projectData.entries.length), (_, x) => false)
  );

  useEffect(() => {
    setEditable(Array.from(Array(projectData.entries.length)));
  }, [projectData]);

 
  // TODO: add files to json file and save

  const saveFiles = (fileList: FileObj[]) => {
    dispatch({ type: 'ADD_FILES', fileList });
  };

  const addEntry = () => {
    dispatch({ type: 'ADD_ENTRY' });
  };

  const updateEntryField = (
    entryIndex: number,
    fieldName: string,
    newValue: any
  ) => {
    dispatch({ type: 'UPDATE_ENTRY_FIELD', entryIndex, fieldName, newValue });
  };

  const openFile = (fileName: string) => {
    console.log('Open file:', path.join(folderPath, fileName));
    ipcRenderer.send('open-file', path.join(folderPath, fileName));
    console.log('after ipcRenderer')
  };

  const filteredEntries = projectData.entries.filter((entryData: EntryType) => {
    return filterTags.every((requiredTag: string) =>
      entryData.tags.includes(requiredTag)
    );
  });

  const makeAllEditable = () => {
    setEditable(Array.from(Array(projectData.entries.length), (_, x) => true));
  };

  const makeAllNonEditable = () => {
    setEditable(Array.from(Array(projectData.entries.length), (_, x) => false));
  };

  const makeEditable = (index: number) => {
    setEditable((oldEditable) =>
      oldEditable.map((d, i) => (i === index ? true : d))
    );
  };

  return (
    <div style={{padding:'10px'}}>
      <ConceptNav concepts={projectData.concepts}/>
      <br />
      <Divider />
      <EdgeControl edges={projectData.edges}/>
      <br />
      <Divider />
      <TagList tags={projectData.tags} />
      <br />
      <Divider />
      <Heading as="h2">Activities</Heading>
    <br/>



      <ButtonGroup style={{display:"inline"}}>
        {!editable.every((t) => t) && (
          <Button onClick={makeAllEditable} type="button">
            <FaEye />
            Show all edit controls
          </Button>
        )}
        {!editable.every((t) => !t) && (
          <Button onClick={makeAllNonEditable} type="button">
            <FaEyeSlash /> Hide all edit controls
          </Button>
        )}
      </ButtonGroup>


      <br />
      <br />

      <TagFilter />

      <br/>

      {filteredEntries.map((entryData: EntryType, i: number) => (
        <>
          {editable[i] ? (
            <Entry
              /* eslint-disable-next-line react/no-array-index-key */
              key={i}
              entryData={entryData}
              entryIndex={i}
              openFile={openFile}
              updateEntryField={updateEntryField}
              allTags={projectData.tags}
            />
          ) : (
            <ReadonlyEntry
              /* eslint-disable-next-line react/no-array-index-key */
              key={i}
              entryData={entryData}
              openFile={openFile}
              makeEditable={() => makeEditable(i)}
            />
          )}

          <Divider marginTop="1em" marginBottom="1em" />
        </>
      ))}      
      
      <Button onClick={addEntry} type="button">
        <FaPlus /> Add entry
      </Button>

    <FileUpload
      saveFiles={saveFiles}
      containerStyle={{}}
      msg={
        <>
          Drag and drop some files here, or <b>click to select files</b>,
          create a new entry.
        </>
      }
    />
  </div>
  );
};

export default ProjectListView;

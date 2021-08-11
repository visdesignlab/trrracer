import path from 'path';
import React from 'react';

import { useProjectState } from './ProjectContext';
import { EntryType, FileObj, ProjectViewProps } from './types';
import Entry from './Entry';
import FileUpload from './FileUpload';
import ViewTypeControl from './ViewTypeControl';
import TagList from './TagList';

const { ipcRenderer } = require('electron');

const ProjectListView = (ProjectPropValues: ProjectViewProps) => {
  const { projectData, folderPath, viewType, setViewType } = ProjectPropValues;

  const [, dispatch] = useProjectState();

  console.log(projectData);

  // TODO: add files to json file and save
  console.log('projectData:', projectData);

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
  };

  return (
    <div>
      <h1>{projectData.title}</h1>

      <ViewTypeControl viewType={viewType} setViewType={setViewType} />

      <TagList tags={projectData.tags} />

      {projectData.entries.map((entryData: EntryType, i: number) => (
        <>
          <Entry
            /* eslint-disable-next-line react/no-array-index-key */
            key={i}
            entryData={entryData}
            entryIndex={i}
            openFile={openFile}
            updateEntryField={updateEntryField}
            allTags={projectData.tags}
          />
          <hr />
        </>
      ))}

      <button onClick={addEntry} type="button">
        Add entry
      </button>

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

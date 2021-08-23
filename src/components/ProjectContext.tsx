import * as fs from 'fs';
import { copyFileSync } from 'fs';

import React, { createContext, useContext, useReducer } from 'react';
import path from 'path';

import { EntryType, File, TagType } from './types';
import getEmptyProject from '../emptyProject';

export const ProjectContext = createContext();

export function useProjectState() {
  return useContext(ProjectContext);
}

const appStateReducer = (state, action) => {
  const saveJSON = (newProjectData) => {
    fs.writeFileSync(
      path.join(state.folderPath, 'trrrace.json'),
      JSON.stringify(newProjectData, null, 4),
      (err) => {
        if (err) {
          console.log(`Error writing file to disk: ${err}`);
        } else {
          // parse JSON string to JSON object
          console.log(newProjectData);
        }
      }
    );

    return { ...state, projectData: newProjectData };
  };

  console.log('ACTION:', action);
  switch (action.type) {
    case 'SET_DATA': {
      return {
        folderPath: action.folderName,
        projectData: action.projectData,
        filterTags: [],
      };
    }

    case 'ADD_TAG_TO_ENTRY': {
      const { newTag, entryIndex } = action;

      const existingTags = state.projectData.tags.map((k) => k.title);

      let newTags;
      if (!existingTags.includes(newTag.text)) {
        newTags = [
          ...state.projectData.tags,
          { title: newTag.text, color: 'black' },
        ];
      } else {
        newTags = state.projectData.tags;
        // projectData
      }

      const newEntries = state.projectData.entries.map(
        (d: EntryType, i: number) =>
          entryIndex === i ? { ...d, tags: [...d.tags, newTag.text] } : d
      );

      const newProjectData = {
        ...state.projectData,
        tags: newTags,
        entries: newEntries,
      };

      return saveJSON(newProjectData);
    }

    case 'ADD_FILES_TO_ENTRY': {
      const { fileList, entryIndex } = action;

      let newFiles = state.projectData.entries[entryIndex].files;
      for (const file of fileList) {
        try {
          let saveFile = true;
          let destination = path.join(state.folderPath, file.name);
          let newName = file.name;

          if (fs.existsSync(destination)) {
            saveFile = window.confirm(
              `A file with name ${newName} has already been imported. Do you want to import this file anyway, with a modified name?`
            );

            let i = 1;
            do {
              const parts = file.name.split('.');
              const base = parts.slice(0, -1).join('');
              const extension = parts.slice(-1)[0];
              newName = `${base} (${i}).${extension}`;

              destination = path.join(state.folderPath, newName);
              console.log('Trying new name:', newName);

              i += 1;
            } while (fs.existsSync(destination));
          }

          if (saveFile) {
            copyFileSync(file.path, destination);
            console.log(`${file.path} was copied to ${destination}`);
            newFiles = [...newFiles, { title: newName }];
          }
        } catch (e) {
          console.log('Error', e.stack);
          console.log('Error', e.name);
          console.log('Error', e.message);

          console.log('The file could not be copied');
        }
      }

      const entries = state.projectData.entries.map((d: EntryType, i: number) =>
        entryIndex === i ? { ...d, files: newFiles } : d
      );

      const newProjectData = { ...state.projectData, entries };

      return saveJSON(newProjectData);
    }

    case 'ADD_URL': {
      const entries = state.projectData.entries.map((d: EntryType, i: number) =>
        action.entryIndex === i
          ? {
              ...d,
              urls: [...d.urls, { url: action.url, title: action.title }],
            }
          : d
      );

      const newProjectData = { ...state.projectData, entries };
      return saveJSON(newProjectData);
    }

    case 'ADD_FILES': {
      const { fileList } = action;

      console.log('ADD_FILES:', fileList);

      let copiedFiles: File[] = [];

      for (const file of fileList) {
        try {
          const destination = path.join(state.folderPath, file.name);
          copyFileSync(file.path, destination);
          console.log(`${file.path} was copied to ${destination}`);
          copiedFiles = [...copiedFiles, { title: file.name }];
        } catch (e) {
          console.log('Error', e.stack);
          console.log('Error', e.name);
          console.log('Error', e.message);

          console.log('The file could not be copied');
        }
      }

      const newProjectData = {
        ...state.projectData,
        entries: [
          ...state.projectData.entries,
          {
            title: 'New entry',
            description: '',
            files: copiedFiles,
            date: new Date().toISOString(),
            tags: [],
          },
        ],
      };

      return saveJSON(newProjectData);
    }

    case 'DELETE_FILE': {
      const destination = path.join(state.folderPath, action.fileName);

      const deleteFile = window.confirm(
        `Really delete file ${action.fileName}?`
      );

      if (!deleteFile) {
        return state;
      }

      fs.unlinkSync(destination);

      const entries = state.projectData.entries.map((d: EntryType, i: number) =>
        action.entryIndex === i
          ? { ...d, files: d.files.filter((f) => f.title !== action.fileName) }
          : d
      );

      const newProjectData = { ...state.projectData, entries };
      return saveJSON(newProjectData);
    }

    case 'ADD_ENTRY': {
      const newProjectData = {
        ...state.projectData,
        entries: [
          ...state.projectData.entries,
          {
            title: 'New entry',
            description: '',
            files: [],
            date: new Date().toISOString(),
            tags: [],
          },
        ],
      };

      return saveJSON(newProjectData);
    }

    case 'UPDATE_ENTRY_FIELD': {
      const entries = state.projectData.entries.map((d: EntryType, i: number) =>
        action.entryIndex === i
          ? { ...d, [action.fieldName]: action.newValue }
          : d
      );

      const newProjectData = { ...state.projectData, entries };

      return saveJSON(newProjectData);
    }

    case 'UPDATE_TAG_COLOR': {
      const tags = state.projectData.tags.map((tag: TagType, i: number) =>
        i === action.tagIndex ? { ...tag, color: action.color } : tag
      );

      const newProjectData = { ...state.projectData, tags };

      return saveJSON(newProjectData);
    }
    case 'UPDATE_TAG_NAME': {
      const tags = state.projectData.tags.map((tag: TagType, i: number) =>
        i === action.tagIndex ? { ...tag, title: action.title } : tag
      );

      const oldTitle = state.projectData.tags[action.tagIndex].title;

      const entries = state.projectData.entries.map((entry: EntryType) => ({
        ...entry,
        tags: entry.tags.map((t) => (t === oldTitle ? action.title : t)),
      }));

      const newProjectData = { ...state.projectData, tags, entries };

      return saveJSON(newProjectData);
    }

    case 'DELETE_TAG': {
      const tags = state.projectData.tags.filter(
        (tag: TagType) => tag.title !== action.title
      );

      const entries = state.projectData.entries.map((e: EntryType) => ({
        ...e,
        tags: e.tags.filter((t) => t !== action.title),
      }));

      const newProjectData = { ...state.projectData, tags, entries };

      return saveJSON(newProjectData);
    }

    case 'UPDATE_FILTER_TAGS': {
      return { ...state, filterTags: action.filterTags };
    }

    default: {
      console.log("Can't handle:", action);
      return state;
    }
  }
};

const initialState = {
  projectData: getEmptyProject(),
  folderPath: null,
  filterTags: [],
};

export function ProjectStateProvider({ children }) {
  const reducer = useReducer(appStateReducer, initialState);

  return (
    <ProjectContext.Provider value={reducer}>
      {children}
    </ProjectContext.Provider>
  );
}

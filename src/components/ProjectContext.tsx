import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import React, { createContext, useContext, useReducer } from 'react';
import path from 'path';
import * as googleCred from '../../assets/google_cred_desktop_app.json';
import { EntryType, File, FileObj, TagType, ProjectState } from './types';
import { sendToFlask } from '../flaskHelper';

const { google } = require('googleapis');

export const ProjectContext = createContext<DispatchType>();

type DispatchType = [ProjectState, (msg: any) => ProjectState];

export function useProjectState() {
  return useContext<DispatchType>(ProjectContext);
}

export function addMetaDescrip(projectData, state) {
  const newProjEntries = projectData.entries.map((e: EntryType) => {
    e.files = e.files.map((f) => {
      if (!f.context) {
        f.context = 'null';
      }
      return f;
    });
    return e;
  });

  const newProj = { ...projectData, entries: newProjEntries };

  return null; // saveJSON(newProj);

  // });
}

const pickTagColor = (tags: TagType[]) => {
  const allColors = [
    '#B80000',
    '#DB3E00',
    '#FCCB00',
    '#008B02',
    '#006B76',
    '#1273DE',
    '#004DCF',
    '#5300EB',
    '#EB9694',
    '#FAD0C3',
    '#FEF3BD',
    '#C1E1C5',
    '#BEDADC',
    '#C4DEF6',
    '#BED3F3',
    '#D4C4FB',
  ];
  const usedColors = tags.map((k) => k.color);
  const unusedColors = allColors.filter((c) => !usedColors.includes(c));
  const availableColors = unusedColors.length > 0 ? unusedColors : allColors;

  return availableColors[Math.floor(Math.random() * availableColors.length)];
};

const copyFiles = (fileList: FileObj[], folderPath: string) => {
  let newFiles: File[] = [];
  for (const file of fileList) {
    const sourceIsInProjectDir = file.path.startsWith(folderPath);
    let destination = path.join(folderPath, file.name);
    /**
     * is it google??
     */
    const nameCheck = file.name.split('.');

    if (nameCheck[nameCheck.length - 1] === 'gdoc') {
      if (fs.existsSync(destination) && !sourceIsInProjectDir) {
        const newFile = {
          title: `${file.name}`,
          fileType: nameCheck[nameCheck.length - 1],
          context: 'null',
          artifactType: file.artifactType,
        };

        newFiles = [...newFiles, newFile];
      } else {
        copyGoogle(file, newFiles).then((fileArray) => {
          newFiles = [...fileArray];
        });
      }
    } else {
      try {
        let saveFile = true;
        let newName = file.name;

        if (fs.existsSync(destination) && !sourceIsInProjectDir) {
          saveFile = window.confirm(
            `A file with name ${newName} has already been imported. Do you want to import this file anyway, with a modified name?`
          );

          let i = 1;
          do {
            const parts = file.name.split('.');
            const base = parts.slice(0, -1).join('');
            const extension = parts.slice(-1)[0];
            newName = `${base} (${i}).${extension}`;

            destination = path.join(folderPath, newName);

            i += 1;
          } while (fs.existsSync(destination) && !sourceIsInProjectDir);
        }

        if (saveFile) {
          if (!sourceIsInProjectDir) {
            fs.copyFileSync(file.path, destination);
          }
          console.log(`${file.path} was copied to ${destination}`);
          newFiles = [
            ...newFiles,
            {
              title: newName,
              fileType: nameCheck[nameCheck.length - 1],
              context: 'null',
              artifactType: file.artifactType,
            },
          ];
        }
      } catch (e) {
        console.log('Error', e.stack);
        console.log('Error', e.name);
        console.log('Error', e.message);

        console.log('The file could not be copied');
      }
    }
  }

  return newFiles;
};

export async function getGoogleIds(projectData, state) {
  const oAuth2Client = new google.auth.OAuth2(
    googleCred.installed.client_id,
    googleCred.installed.client_secret,
    googleCred.installed.redirect_uris[0]
  );
  const token = fs.readFileSync('token.json', { encoding: 'utf-8' });
  oAuth2Client.setCredentials(JSON.parse(token));

  const drive = google.drive({ version: 'v3', auth: oAuth2Client });

  drive.files
    .list({
      q: `"1-tPBWWUaf7CzNYRyVOqfZvmYg3I4r9Zg" in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })
    .then((fi) => {
      const newProjEntries = projectData.entries.map((e: EntryType) => {
        e.files = e.files.map((f) => {
          const nameCheck = f.title.split('.');

          if (nameCheck[nameCheck.length - 1] === 'gdoc') {
            const id = fi.data.files.filter((m) => {
              return `${m.name}.gdoc` === f.title;
            });

            if (id.length != 0) {
              f.fileType = 'gdoc';
              f.fileId = id[0].id;
            }
          }

          return f;
        });

        return e;
      });

      const newProj = { ...projectData, entries: newProjEntries };
      return saveJSON(newProj, state);
    });
}

async function copyGoogle(file: any, fileList: any) {
  const oAuth2Client = new google.auth.OAuth2(
    googleCred.installed.client_id,
    googleCred.installed.client_secret,
    googleCred.installed.redirect_uris[0]
  );
  const token = fs.readFileSync('token.json', { encoding: 'utf-8' });
  oAuth2Client.setCredentials(JSON.parse(token));

  const drive = google.drive({ version: 'v3', auth: oAuth2Client });
  const nameF = file.name.split('.');

  drive.files
    .list({
      q: `name="${nameF[0]}" and trashed = false`,
      fields: 'nextPageToken, files(id, name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })
    .then((fi) => {
      const copyRequest = {
        // Modified
        name: nameF,
        parents: ['1-tPBWWUaf7CzNYRyVOqfZvmYg3I4r9Zg'],
      };

      drive.files.copy(
        {
          // Modified
          fileId: fi.data.files[0].id,
          requestBody: copyRequest, // or resource: copyRequest
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        },
        function (err, response) {
          if (err) {
            console.log(err);
            // res.send("error");
            return;
          }
          // let newFiles = state.projectData.entries[entryIndex].files;
          const newFile = {
            title: `${file.name}`,
            fileType: nameF[nameF.length - 1],
            context: 'null',
            fileId: response.data.id,
          };

          fileList = [...fileList, newFile];
        }
      );
    });

  return fileList;
}

export const readProjectFile = (
  folderPath: string,
  fileName: string,
  fileType: any
) => {
  const filePath = path.join(folderPath, fileName);
  const fileContents = fs.readFileSync(filePath, { encoding: 'utf-8' });
  if (!fileType) {
    return JSON.parse(fileContents);
  }
  console.log('this is a text file', fileContents);
};

const appStateReducer = (state: any, action: any) => {
  /**
   *  function for set data that checks to see if the file exists and if not, creates one.
   * research_threads = readProjectFile(baseDir, 'research_threads.json');
   */

  const checkRtFile = (dir: any) => {
    const filePath = dir[dir.length - 1] != '/' ? `${dir}/` : dir;

    try {
      return readProjectFile(dir, 'research_threads.json', null);
    } catch (e) {
      const rtOb = {
        title: action.projectData.title,
        research_threads: [],
      };

      saveJSONRT(rtOb, filePath);
      return rtOb;
    }
  };

  const saveJSON = (newProjectData: any) => {
    fs.writeFileSync(
      path.join(state.folderPath, 'trrrace.json'),
      JSON.stringify(newProjectData, null, 4),
      (err) => {
        if (err) {
          console.log(`Error writing file to disk: ${err}`);
        } else {
          // parse JSON string to JSON object
        }
      }
    );
    return { ...state, projectData: newProjectData };
  };

  const saveJSONRT = (RTData: any, dir: string) => {
    fs.writeFileSync(
      path.join(dir, 'research_threads.json'),
      JSON.stringify(RTData, null, 4),
      (err) => {
        if (err) {
          console.log(`Error writing file to disk: ${err}`);
        } else {
          // parse JSON string to JSON object
        }
      }
    );

    return { ...state, researchThreads: RTData };
  };

  switch (action.type) {
    case 'SET_DATA': {
      const baseDir = action.folderName;

      let roleData;
      let google_data: any;
      let txt_data: any;
      let artifact_types: any;
      let google_em: any;
      let google_comms: any;

      let newEntries = [...action.projectData.entries];

      try {
        google_em = readProjectFile(baseDir, 'goog_em.json', null);
        console.log('yes to google em file');
      } catch (e: any) {
        console.error('could not load google em file');
        google_em = null;
      }

      try {
        google_data = readProjectFile(baseDir, 'goog_data.json', null);
        console.log('yes to goog data file');
      } catch (e: any) {
        console.error('could not load google data file');
      }

      try {
        google_comms = readProjectFile(baseDir, 'goog_comms.json', null);
        console.log('yes to goog comments');
      } catch (e) {
        google_comms = null;
        console.log('could not load goog comments');
      }

      try {
        txt_data = readProjectFile(baseDir, 'text_data.json', null);
        console.log('yes to txtData');
      } catch (e) {
        txt_data = null;
        console.error('could not load text data');
      }

      try {
        roleData = readProjectFile(baseDir, 'roles.json', null);
        console.log('yes to role data');
      } catch (e) {
        console.error('could not load role data');
      }

      try {
        artifact_types = readProjectFile(baseDir, 'artifactTypes.json', null);
        console.log('yes to artifact types data');
      } catch (e) {
        artifact_types = null;
        console.error('could not load artifact types');
      }

      try {
        newEntries = action.projectData.entries.map((e, i) => {
          e.index = i;
          e.key_txt = txt_data
            ? txt_data['text-data'].filter((td) => td['entry-index'] === i)
            : [];

          e.files = e.files.map((ef) => {
            if (ef.fileType === 'gdoc') {
              // ef.artifactType = 'notes'
              ef.emphasized = google_em ? google_em[ef.fileId] : [];
              ef.comments = google_comms ? google_comms[ef.fileId] : [];
            }
            // else if(ef.fileType === 'pdf'){
            //   ef.artifactType = 'related work';
            // }
            // else if(ef.title.includes('.png')){
            //   ef.artifactType = 'sketch';
            // }

            // else if(ef.title.includes('https:/')){
            //   ef.artifactType = 'link';
            // }
            // else if(ef.fileType === 'txt'){
            //   ef.artifactType = 'transcript';
            // }
            // else if(ef.fileType === 'eml'){
            //   ef.artifactType = 'correspondence'
            // }
            // else if(ef.fileType === 'csv' || ef.fileType === 'phy' || ef.fileType === 'htm'){
            //   ef.artifactType = 'data'
            // }else if(ef.fileType === 'gif' || ef.fileType === 'jpg'){
            //   ef.artifactType = 'tool artifact'
            // }
            // else if(ef.title.includes('Screen ')){
            //   ef.artifactType = 'tool artifact';
            // }
            ef.artifactType = ef.artifactType ? ef.artifactType : '';
            return ef;
          });
          // }

          return e;
        });
      } catch (e) {
        newEntries = action.projectData.entries;

        return e;
      }
      console.log('base dir in set data', baseDir);
      const research_threads = checkRtFile(baseDir);

      const entriesAssociated = [...research_threads.research_threads].map(
        (rt) => {
          rt.tagged_activities = [...rt.associated_tags].map((at) => {
            const matchOb = { tag: at };
            matchOb.associatedActivities = newEntries.filter((f) =>
              f.tags.includes(at)
            );
            return matchOb;
          });
          return rt;
        }
      );

      research_threads.research_threads = entriesAssociated;

      const newProjectData = {
        ...action.projectData,
        entries: newEntries,
        roles: roleData,
        eventArray: action.projectData.eventArray ? action.projectData.eventArray : []
      };

      return {
        folderPath: action.folderName,
        projectData: newProjectData,
        googleData: google_data,
        txtData: txt_data,
        researchThreads: research_threads,
        selectedThread: null,
        filterTags: [],
        filterType: null,
        filterDates: [null, null],
        filterRT: null,
        filterQuery: null,
        query: null,
        hopArray: [],
        goBackView: 'overview',
        artifactTypes: artifact_types,
        // eventArray: [],
      };
    }

    case 'UPDATE_TITLE': {
      const newProjectData = {
        ...state.projectData,
        title: action.title,
      };

      return saveJSON(newProjectData);
    }

    case 'ADD_EVENT': {
      console.log(action.eventArray);
      const newProjectData = {
        ...state.projectData,
        eventArray: action.eventArray,
      };
      return saveJSON(newProjectData);
    }

    case 'UPDATE_GO_BACK': {
      return {
        ...state,
        goBackView: action.goBackView,
        filterQuery: action.filterQuery,
      };
    }

    case 'ADD_TAG_TO_THREAD': {
      const { tag, threadIndex } = action;

      const newRT = { ...state.researchThreads };

      newRT.research_threads[threadIndex].associated_tags.push(tag);

      return saveJSONRT(newRT, state.folderPath);
    }

    case 'QUERY_TERM': {
      return {
        ...state,
        query: { term: action.term, matches: action.matches },
        filterQuery: action.matches.map((m) => m.entry.title),
      };
    }

    case 'ADD_ACTIVITY_TO_THREAD': {
      const { activity, rationale, activityIndex, threadIndex } = action;

      const newRT = state.researchThreads;

      const newA = {
        type: 'activity',
        dob: activity.date,
        activity_index: activityIndex,
        title: activity.title,
        rationale,
      };
      newRT.research_threads[threadIndex].evidence.push(newA);

      return saveJSONRT(newRT, state.folderPath);
    }

    case 'ADD_ARTIFACT_TO_THREAD': {
      const { activity, rationale, artifactIndex, threadIndex } = action;
      const newRT = state.researchThreads;
      console.log('activity files', activity.files, artifactIndex);
      const newA = {
        type: 'artifact',
        dob: activity.date,
        activity_index: activity.index,
        artifactIndex,
        activityTitle: activity.title,
        artifactTitle: activity.files[artifactIndex].title,
        rationale,
      };
      newRT.research_threads[threadIndex].evidence.push(newA);

      return saveJSONRT(newRT, state.folderPath);
    }

    case 'THREAD_FILTER': {
      if (action.filterRT) {
        return {
          ...state,
          filterRT: {
            title: action.filterRT.title,
            key: action.filterRT.evidence.map((m) => m.activityTitle),
            associatedKey:
              action.filterRT.tagged_activities &&
              action.filterRT.tagged_activities.length > 0
                ? action.filterRT.tagged_activities.flatMap((fm) =>
                    fm.associatedActivities.map((a) => a.title)
                  )
                : [],
          },
        };
      }
      return { ...state, filterRT: null, selectedThread: null };
    }

    case 'ADD_FRAGMENT_TO_THREAD': {
      const {
        activity,
        rationale,
        artifactIndex,
        threadIndex,
        fragment,
        fragmentType,
      } = action;
      const newRT = state.researchThreads;
      const newA = {
        type: 'fragment',
        dob: activity.date,
        activity_index: activity.index,
        artifactIndex,
        activityTitle: activity.title,
        artifactTitle: activity.files[artifactIndex].title,
        rationale,
        anchors: [{ anchor_type: fragmentType, frag_type: fragment }],
      };
      newRT.research_threads[threadIndex].evidence.push(newA);
      return saveJSONRT(newRT, state.folderPath);
    }

    case 'ADD_TAG_TO_ENTRY': {
      const { newTag, entryIndex } = action;

      const existingTags = state.projectData.tags.map((k) => k.title);
      const newColor = pickTagColor(state.projectData.tags);
      let newTags;

      console.log(newTag, entryIndex);

      if (!existingTags.includes(newTag.text)) {
        newTags = [
          ...state.projectData.tags,
          {
            title: newTag.text,
            color: newColor,
            date: new Date().toISOString(),
          },
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
      const currentFiles = state.projectData.entries[entryIndex].files;

      const newFiles = [
        ...currentFiles,
        ...copyFiles(fileList, state.folderPath),
      ];
      const entries = state.projectData.entries.map((d: EntryType, i: number) =>
        entryIndex === i ? { ...d, files: newFiles } : d
      );

      const newProjectData = { ...state.projectData, entries };

      const newPD = saveJSON(newProjectData);
      console.log('file list', fileList);
      if (fileList.map((m) => m.type).includes('text/plain')) {
        console.log('has a text file!!');
        sendToFlask('get_all_sig_blobs', state.projectData.title).then(
          (json) => {
            state.txtData = json;
          }
        );
      }

      return newPD; // saveJSON(newProjectData);
    }

    case 'CREATED_GOOGLE_IN_ENTRY': {
      return action.newProjectData;
    }

    case 'HIGHLIGHT_TAG': {
      return { ...state, highlightedTag: action.highlightedTag };
    }

    case 'HIGHLIGHT_TYPE': {
      return { ...state, highlightedType: action.highlightedType };
    }

    case 'SELECTED_ARTIFACT': {
      return {
        ...state,
        selectedArtifactEntry: action.selectedArtifactEntry,
        selectedArtifactIndex: action.selectedArtifactIndex,
        hopArray: action.hopArray == Number ? hopArray : action.hopArray,
      };
    }

    case 'SELECTED_THREAD': {
      return { ...state, selectedThread: action.selectedThread };
    }

    case 'DELETE_EVIDENCE_FROM_THREAD': {
      return { ...state, researchThreads: action.researchThreads };
    }

    case 'ADD_URL': {
      let newFiles = state.projectData.entries[action.entryIndex].files;
      newFiles = [
        ...newFiles,
        { title: action.title, url: action.url, fileType: 'url' },
      ];

      const entries = state.projectData.entries.map((d: EntryType, i: number) =>
        action.entryIndex === i ? { ...d, files: newFiles } : d
      );

      const newProjectData = { ...state.projectData, entries };
      return saveJSON(newProjectData);
    }

    case 'CREATE_THREAD': {
      const randomColor = Math.floor(Math.random() * 16777215).toString(16);

      const threadOb = {
        title: action.threadName,
        actions: [{ action: 'created', when: new Date() }],
        rt_id: uuidv4(),
        description: action.threadDescription,
        associated_tags: [],
        color: `#${randomColor}`,
        evidence: [],
      };
      const newRT = state.researchThreads;
      newRT.research_threads.push(threadOb);

      console.log('THREADOB', threadOb);

      return saveJSONRT(newRT, state.folderPath);
    }

    case 'ADD_FILES': {
      const { fileList } = action;

      const copiedFiles = copyFiles(fileList, state.folderPath);

      const newEntry: EntryType = {
        title: 'New entry',
        description: '',
        files: copiedFiles,
        date: new Date().toISOString(),
        tags: [],
        urls: [],
      };
      const newProjectData = {
        ...state.projectData,
        entries: [...state.projectData.entries, newEntry],
      };

      return saveJSON(newProjectData);
    }

    case 'DELETE_FILE': {
      const destination = path.join(state.folderPath, action.fileName);

      const unattachFile = window.confirm(
        `Really un-attach file ${action.fileName}?`
      );

      if (!unattachFile) {
        return state;
      }

      let otherUses = false;
      for (let i = 0; i < state.projectData.entries.length; i += 1) {
        const entry = state.projectData.entries[i];

        const fileNames = entry.files.map((f: File) => f.title);

        if (i !== action.entryIndex && fileNames.includes(action.fileName)) {
          otherUses = true;
          break;
        }
      }

      if (!otherUses) {
        const deleteFile = window.confirm(
          `File ${action.fileName} is not attached to any other entries - delete from project directory?`
        );

        if (deleteFile) {
          fs.unlinkSync(destination);
        }
      }

      const entries = state.projectData.entries.map((d: EntryType, i: number) =>
        action.entryIndex === i
          ? { ...d, files: d.files.filter((f) => f.title !== action.fileName) }
          : d
      );

      const newProjectData = { ...state.projectData, entries };
      return saveJSON(newProjectData);
    }

    case 'ADD_ENTRY': {
      const newEntry: EntryType = {
        title: 'New entry',
        description: '',
        files: [],
        date: new Date().toISOString(),
        tags: [],
        urls: [],
      };

      const newProjectData = {
        ...state.projectData,
        entries: [...state.projectData.entries, newEntry],
      };

      return saveJSON(newProjectData);
    }
    case 'DELETE_ENTRY': {
      const confirmed = window.confirm(
        'Are you sure that you want to delete this entry? This will not delete attached files.'
      );
      if (!confirmed) {
        return state;
      }

      const newProjectData = {
        ...state.projectData,
        entries: state.projectData.entries.filter(
          (e, i: number) => i !== action.entryIndex
        ),
      };

      return saveJSON(newProjectData);
    }

    case 'UPDATE_ENTRY_FIELD': {
      const entries = state.projectData.entries.map((d: EntryType, i: number) =>
        action.entryIndex === i
          ? { ...d, [action.fieldName]: action.newValue }
          : d
      );
      console.log('in project state', entries);
      const newProjectData = { ...state.projectData, entries };
      console.log('new project data in project context', newProjectData);
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
      console.log('update filter', action.filterTags);
      return { ...state, filterTags: action.filterTags };
    }

    case 'UPDATE_FILTER_TYPES': {
      return { ...state, filterType: action.filterType };
    }

    case 'UPDATE_FILTER_DATES': {
      return { ...state, filterDates: action.filterDates };
    }

    case 'ADD_MARKS_TO_ARTIFACT': {
      const { markers, activity, artifactIndex } = action;

      const newFile = activity.files[artifactIndex];
      newFile.markers = markers;
      const entryIndex = activity.index;
      state.projectData.entries[entryIndex].files[artifactIndex] = newFile;

      const { entries } = state.projectData;
      entries[entryIndex].files[artifactIndex] = newFile;
      const newProjectData = { ...state.projectData, entries };

      return saveJSON(newProjectData);
    }

    case 'HOVER_OVER_ACTIVITY': {
      return {
        ...state,
        hoverActivity: action.hoverActivity,
      };
    }

    case 'HOVER_THREAD': {
      console.log('actionnnnn', action.researchThreadHover);

      return {
        ...state,
        researchThreadHover: action.researchThreadHover,
      };
    }

    default: {
      console.log("Can't handle:", action);
      return state;
    }
  }
};

const initialState: ProjectState = {
  projectData: null,
  // projectData: getEmptyProject('null'),
  folderPath: null,
  filterTags: [],
  filterType: null,
};

export function ProjectStateProvider({ children }) {
  const reducer = useReducer(appStateReducer, initialState);

  return (
    <ProjectContext.Provider value={reducer}>
      {children}
    </ProjectContext.Provider>
  );
}

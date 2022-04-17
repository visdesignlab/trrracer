import React, { useState, useMemo } from 'react';

import {
  Button,
  Heading,
  ListItem,
  Tag,
  Text,
  UnorderedList,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  Box,
  SimpleGrid,
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import { FaExternalLinkAlt, FaLock } from 'react-icons/fa';
import { format } from 'date-fns';
import * as Showdown from 'showdown';
import AttachmentPreview from './AttachmentPreview';
import { EntryType, File } from './types';
import { useProjectState } from './ProjectContext';

interface EntryPropTypes {
  entryData: EntryType;
  openFile: (a: string, fp: string) => void;
  makeEditable: () => void;
  setViewType: (viewType: string) => void;
}

const converter = new Showdown.Converter({
  tables: true,
  simplifiedAutoLink: true,
  strikethrough: true,
  tasklists: true,
});

interface ReadonlyArtifactPropTypes {
  entryData: EntryType;
  openFile: (a: string, fp: string) => void;
  setViewType: (viewType: string) => void;
  file: File;
  i: number;
}

const ReadonlyArtifact = (props: ReadonlyArtifactPropTypes) => {
  const { entryData, openFile, setViewType, file, i } = props;
  const [{ folderPath }, dispatch] = useProjectState();

  const [showPopover, setShowPopover] = useState(false);

  const closePopover = () => {
    setShowPopover(false);
  };

  return (
    <>
      <Box bg="#ececec" p={3} opacity={.5}>
        {showPopover ? (
          <Popover isOpen={showPopover} onClose={closePopover}>
            <PopoverTrigger>
              <div>
                {['png', 'jpg', 'gif'].includes(file.fileType) && (
                  <AttachmentPreview
                    folderPath={folderPath}
                    title={file.title}
                    openFile={openFile}
                  />
                )}
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 5,
                    width: 75,
                    display: 'inline',
                  }}
                >
                  {' '}
                  {file.title}{' '}
                </div>
                <FaExternalLinkAlt
                  onClick={() => openFile(file.title, folderPath)}
                  title="Open file externally"
                  size="13px"
                  style={{ display: 'inline' }}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent bg="white" color="gray">
              <PopoverArrow bg="white" />
              <PopoverBody>
                <Button
                  onClick={() => {
                    setViewType('detail view');
                    dispatch({
                      type: 'SELECTED_ARTIFACT',
                      selectedArtifactEntry: entryData,
                      selectedArtifactIndex: i,
                      hopArray: [entryData],
                    });
                  }}
                >
                  See artifact in detail.
                </Button>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        ) : (
          <div onMouseEnter={() => setShowPopover(true)}>
            {['png', 'jpg', 'gif'].includes(file.fileType) && (
              <AttachmentPreview
                folderPath={folderPath}
                title={file.title}
                openFile={openFile}
              />
            )}
            <div
              style={{
                fontSize: 18,
                fontWeight: 500,
                marginBottom: '5px',
                width: '50%',
                display: 'inline',
              }}
            >
              {' '}
              {file.title}{' '}
            </div>
            <FaExternalLinkAlt
              onClick={() => openFile(file.title, folderPath)}
              title="Open file externally"
              size="13px"
              style={{ display: 'inline' }}
            />
          </div>
        )}

      </Box>
    </>
  );
};

const ThreadedArtifact = (props:any) => {

  const { isEntryInThread, selectedThread, fileData, folderPath } = props;

  return(
    <Box bg="#ececec" p={3}>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 5,
          width: 75,
          display: 'inline',
        }}
        className="threaded-file"
      >
        {fileData.threadPart.type === "fragment" ? "Fragment of artifact: " : "Threaded artifact: " }
        {fileData.title}{' '}
        <div
        style={{marginTop:10}}
        >{"Why this was included: "}</div>
        <div
          style={{fontWeight: 200}}
        >{fileData.threadPart.rationale}</div>
          {['png', 'jpg', 'gif'].includes(fileData.fileType) && (
                  <AttachmentPreview
                    folderPath={folderPath}
                    title={fileData.title}
                    //openFile={openFile}
                  />
                )}
      </div>

    </Box>

  )

}

const ActivityTitleLogic = (props:any) => {

  const { isEntryInThread, selectedThread, entryData } = props;

  if(isEntryInThread.length === 0){
    return (
      <div>
        <span>{entryData.title}</span>
        <div style={{fontSize:15, display:'block', marginTop:10, marginBottom:10}}>
          {'This activity has a tag associated with'} {selectedThread.title}
        </div> 
      </div>
      
    )
  }else{

    return(
      <div>
        <span>{entryData.title}</span>
          {
            isEntryInThread.map((m, i)=> (
              <div 
              key={`artifact-threaded-${i}`}
              style={{ fontSize:15, display:'block', marginTop:10, marginBottom:10 }}>
                {
                  (m.type === 'fragment' || m.type === 'artifact') ? 
                    <>
                     {'An artifact from this activity is threaded in'} {selectedThread.title}
                    </>
                    : 
                    <>
                      {'This activity is threaded in'} {selectedThread.title}
                    </>
                }
              </div> 
            ))
          }
      </div>
    )

  }
}

const ThreadedReadonlyEntry = (props: EntryPropTypes) => {
  const { entryData, makeEditable, openFile, setViewType, viewType } = props;
  const [{ projectData, researchThreads, filterRT, folderPath }] = useProjectState();

  let selectedThread = researchThreads.research_threads.filter(f=> f.title === filterRT.title)[0];

 
 
  let isEntryInThread = selectedThread.evidence.filter(f => f.activityTitle === entryData.title);

  

  const urls = entryData.files.filter((f) => f.fileType === 'url');
  const files = entryData.files.filter((f) => f.fileType !== 'url');

  let activitiesAsEvidence = isEntryInThread.filter(f => f.type === 'fragment' || f.type === 'artifact');

  let threadedFiles = files.filter(f => activitiesAsEvidence.map(m=> m.artifactTitle).includes(f.title))
  .map(m => {
    m.threadPart = activitiesAsEvidence.filter(f=> f.artifactTitle === m.title)[0];
    return m;
  });

  let otherFiles = files.filter(f => activitiesAsEvidence.map(m=> m.artifactTitle).indexOf(f.title) === -1)
  let threadedActivity = isEntryInThread.filter(f => f.type === 'activity');



  if (entryData.description != '') {
    const split = entryData.description.split(
      /(^.*?[a-z]{2,}[.!?])\s+\W*[A-Z]/
    );
  }

  const checkTagColor = (tagName: string) => {
    const tagFil = researchThreads.research_threads.filter((f: any) => {
      return f.associated_tags.indexOf(tagName) > -1;
    });
    if (tagFil.length > 0) return tagFil[tagFil.length - 1].color;
    return '#D4D4D4';
  };



  // Cache the results of converting markdown to HTML, to avoid re-converting on every render
  const descriptionHTML = useMemo(() => {
    converter.makeHtml(entryData.description);
  }, [entryData.description]);

  return (
    <Box>
      <span style={{ fontSize: 22, fontWeight: 'bold' }}>
        {entryData.isPrivate && (
          <FaLock
            title="This entry is private, and will be hidden when the Trrrace is exported."
            size="0.75em"
            style={{ display: 'inline', fill: 'lightgrey' }}
          />
        )}
        {viewType != 'detail' && (
         
          <div>
            <ActivityTitleLogic isEntryInThread={isEntryInThread} selectedThread={selectedThread} entryData={entryData} /> 
          </div>
        )}

        {makeEditable && (
          <Button leftIcon={<EditIcon />} onClick={makeEditable}>
            Edit (THIS IS RT VERSION)
          </Button>
        )}
      </span>

      <Text style={{ fontSize: 15, fontWeight: 'bold' }}>
        {format(new Date(entryData.date), 'dd MMMM yyyy')}
      </Text>
      <p>
        {entryData.tags.length === 0 ? (
          <b>No tags.</b>
        ) : (
          <>
            {entryData.tags.map((t) => (
              <Tag
                key={t}
                backgroundColor={checkTagColor(t)}
                marginRight="0.25em"
                marginBottom="0.25em"
              >
                {t}
              </Tag>
            ))}
          </>
        )}
      </p>
      <br />
      {
        threadedActivity.length > 0 && (
          <div>{threadedActivity[0].rationale}</div>
        )
      }

      {entryData.description != '' && (
        <div
          style={{
            fontSize: '12px',
            fontStyle: 'italic',
            marginTop: '5px',
            marginBottom: 5,
          }}
        >
          {entryData.description}
          <br />
        </div>
      )}
  
      <SimpleGrid columns={1} spacing={3}>
        {threadedFiles.map((f, i) => (
          <ThreadedArtifact 
            key={`threaded-${i}`}
            isEntryInThread={isEntryInThread} 
            selectedThread={selectedThread} 
            fileData={f}
            folderPath={folderPath}
          />
        ))
        }
        </SimpleGrid>
        <SimpleGrid columns={1} spacing={3}>
        {
          otherFiles.map((f, i)=> (
            <ReadonlyArtifact
              key={`readonly-${i}`}
              entryData={entryData}
              openFile={openFile}
              setViewType={setViewType}
              file={f}
              i={i}
            />
          ))
        }
      </SimpleGrid>
      {urls.length > 0 && (
        <>
          <Heading as="h3" size="lg">
            URLs
          </Heading>
          <UnorderedList>
            {urls.map((url, i) => (
              <ListItem key={`${url.url}-${i}`}>
                <a href={url.url}>{url.title} </a>
                <FaExternalLinkAlt
                  title="Open URL in default web browser"
                  size="12px"
                  style={{ display: 'inline' }}
                />
              </ListItem>
            ))}
          </UnorderedList>
        </>
      )}
    </Box>
  );
};

export default ThreadedReadonlyEntry;

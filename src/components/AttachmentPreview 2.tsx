import path from 'path';
import React, { useState } from 'react';
import { ipcRenderer } from 'electron';

import {
  Image
} from '@chakra-ui/react';

import { GrDocumentCsv, GrDocumentPpt, GrDocumentWord, GrDocumentText, GrDocumentExcel, 
GrDocumentRtf, GrDocumentImage, GrChatOption, GrCluster } from 'react-icons/gr';
import { ImFilePdf } from 'react-icons/im'


interface AttachmentPreviewPropsType {
  folderPath: string;
  title: string;
  openFile: (title: string, fp: string) => void;
  size:number;
}

const AttachmentPreview = (props: AttachmentPreviewPropsType) => {
  const { folderPath, title, openFile, size } = props;

  if (
    title.endsWith('.mp4') ||
    title.endsWith('.mov') ||
    title.endsWith('.webm')
  ) {
    // We can't add a caption, as we have no knowledge of what the file is
    // eslint-disable-next-line jsx-a11y/media-has-caption
    return <video src={`file://${path.join(folderPath, title)}`} controls />;
  }

  if (title.endsWith('.mp3') || title.endsWith('.ogg')) {
    // We can't add a caption, as we have no knowledge of what the file is
    // eslint-disable-next-line jsx-a11y/media-has-caption
    return <audio src={`file://${path.join(folderPath, title)}`} controls />;
  }

  // const size = '65%';

  if (title.endsWith('.csv')) {
    return <GrDocumentCsv onClick={() => openFile(title, folderPath)} size={size} />;
  }

  if (title.endsWith('.ppt') || title.endsWith('.pptx') || title.endsWith('.key')) {
    return <GrDocumentPpt onClick={() => openFile(title, folderPath)} size={size} />;
  }

  if (title.endsWith('.doc') || title.endsWith('.docx')) {
    return <GrDocumentWord onClick={() => openFile(title, folderPath)} size={size} />;
  }

  if (title.endsWith('.gdoc')) {
    return <GrDocumentWord onClick={() => openFile(title, folderPath)} size={size} />;
  }

  if (title.endsWith('.gsheet')) {
    return <GrDocumentExcel onClick={() => openFile(title, folderPath)} size={size} />;
  }

  if (title.endsWith('.txt')) {
    return <GrDocumentText onClick={() => openFile(title, folderPath)} size={size} />;
  }

    if (title.endsWith('.phy') || title.endsWith('.nex')) {
    return <GrCluster onClick={() => openFile(title, folderPath)} size={size} />;
  }

  if (title.endsWith('.rtf')) {
    return <GrDocumentRtf onClick={() => openFile(title, folderPath)} size={size} />;
  }
  if (title.endsWith('.eml')) {
    return <GrChatOption onClick={() => openFile(title, folderPath)} size={size} />;
  }

  if (title.endsWith('.pdf')) {
    return <ImFilePdf onClick={() => openFile(title, folderPath)} size={size} />;
  }

  if (title.endsWith('.HEIC')) {
    return <GrDocumentImage onClick={() => openFile(title, folderPath)} size={size} />;
  }
  return (
    <Image
      src={`file://${path.join(folderPath, title)}`}
      onClick={() => openFile(title, folderPath)}
    />
  );
};

export default AttachmentPreview;
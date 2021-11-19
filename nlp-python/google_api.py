from __future__ import print_function
import os.path
import json
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/drive']

# The ID of a sample document.
DOCUMENT_ID = '195j9eDD3ccgjQRttHhJPymLJUCOUjs-jmwTrekvdjFE'

def goog_auth():
    """Shows basic usage of the Docs API.
    Prints the title of a sample document.
    """
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists('token-py.json'):
        creds = Credentials.from_authorized_user_file('token-py.json', SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                '../assets/google_cred_desktop_app.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token-py.json', 'w') as token:
            token.write(creds.to_json())

    return creds

def goog_doc_start(creds):

    service = build('docs', 'v1', credentials=creds)

    return service

def read_paragraph_element(element):
    """Returns the text in the given ParagraphElement.

        Args:
            element: a ParagraphElement from a Google Doc.
    """
    text_run = element.get('textRun')
   
    if not text_run:
        return ''
    return text_run.get('content')

def get_emphasized_text(doc_content):
    keeper = []
    for par in doc_content:
        if 'paragraph' in par:
            for te in par['paragraph']['elements']:
                if 'textRun' in te:
                    if ("italic", True) in te['textRun']['textStyle'].items():
                        keeper.append(te['textRun'])
                    elif ("bold", True) in te['textRun']['textStyle'].items():
                        keeper.append(te['textRun'])
                    elif "foregroundColor" in te['textRun']['textStyle']:
                        keeper.append(te['textRun'])
                    elif "backgroundColor" in te['textRun']['textStyle']:
                        keeper.append(te['textRun'])
    return keeper


def get_doc_all_by_id(goog_serv, id):
    keeper = []
    doc = goog_serv.documents().get(documentId=id).execute()
    doc_content = doc.get('body').get('content')
 
    for par in doc_content:
        if 'paragraph' in par:
            for te in par['paragraph']['elements']:
               
                if ("italic", True) in te['textRun']['textStyle'].items():
                    keeper.append(te['textRun'])
                elif ("bold", True) in te['textRun']['textStyle'].items():
                    keeper.append(te['textRun'])
                elif "foregroundColor" in te['textRun']['textStyle']:
                    keeper.append(te['textRun'])
                elif "backgroundColor" in te['textRun']['textStyle']:
                    keeper.append(te['textRun'])
    return keeper

def read_strucutural_elements(elements):

    """Recurses through a list of Structural Elements to read a document's text where text may be
        in nested elements.

        Args:
            elements: a list of Structural Elements.
    """
    text = ''
    for value in elements:
        if 'paragraph' in value:
            elements = value.get('paragraph').get('elements')
            for elem in elements:
                text += read_paragraph_element(elem)
        elif 'table' in value:
            # The text in table cells are in nested Structural Elements and tables may be
            # nested.
            table = value.get('table')
            for row in table.get('tableRows'):
                cells = row.get('tableCells')
                for cell in cells:
                    text += read_strucutural_elements(cell.get('content'))
        elif 'tableOfContents' in value:
            # The text in the TOC is also in a Structural Element.
            toc = value.get('tableOfContents')
            text += read_strucutural_elements(toc.get('content'))
    return text

def get_emph_text_by_id():
    doc = docs_service.documents().get(documentId=id).execute()
    doc_content = doc.get('body').get('content')
    
    textOb = {}
    textOb['emphasized'] = get_emphasized_text(doc_content)


def get_doc_text_by_id(docs_service, id):
    doc = docs_service.documents().get(documentId=id).execute()
    doc_content = doc.get('body').get('content')
    
    textOb = {}
    textOb['emphasized'] = get_emphasized_text(doc_content)
    textOb['text'] = read_strucutural_elements(doc_content)

    return textOb
import React from 'react';
import { FormControl, Select } from '@chakra-ui/react';
import { useProjectState } from './ProjectContext';

interface ViewTypeControlProps {
  viewType: string;
  setViewType: (viewType: string) => void;
}

const ViewTypeControl = (props: ViewTypeControlProps) => {
  const { viewType, setViewType } = props;
  const [{}, dispatch] = useProjectState();
  return (
    <>
      <FormControl>
        <Select
          onChange={(ev) => {
            if(viewType === 'overview'){
              dispatch({ type: 'THREAD_FILTER', filterRT: null, selectedThread: null });
            }
            setViewType(ev.target.value)}}
          value={viewType}
          width="max-content"
        >
          <option id="overview">overview</option>
          <option id="paper">paper</option>
        </Select>
      </FormControl>
    </>
  );
};

export default ViewTypeControl;

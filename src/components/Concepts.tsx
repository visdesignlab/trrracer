import React, { useState, useEffect } from 'react';
import { useProjectState } from './ProjectContext';
import { ConceptType, ProjectType, ProjectViewProps} from './types';
import Merger from './MergeConceptForm';

interface ConceptProps {
    concepts: ConceptType[];
}

const ConceptNav = (props:ConceptProps) => {

    const {concepts} = props; 
    const [{ projectData }, dispatch] = useProjectState(); 

    const [showForm, setShowForm] = useState(false);
   
    let conceptList = concepts ? concepts.filter(f=>{
        let actionlist = f.actions.map(m=> m.action);
        return (actionlist.indexOf('deleted') === -1 && actionlist.indexOf('merged') === -1);
    }) : [];

    let fileName = "New Concept";
    let mergeName = "";
    let toName = "";

    function handleChange(event){
      fileName = event.target.value;
    }

    const addConceptForm = ()=>{
        console.log("TESTING");
    }

    const createConcept = ()=>{
        console.log('TEST THIS OUT');
        dispatch({ type: 'CREATE_CONCEPT', title: fileName })
    }

    return(
        <>
        <div>
            <h2>Concepts</h2>
            {showForm ? 
            <div>
            <button onClick={() => {
                setShowForm(false)
                addConceptForm()}}
            >Cancel</button>
            {/* <TextField onChange={handleChange}>
                </TextField> */}
                <form>
                <label>
                    <input type="text" onChange={handleChange}/>
                </label>
                </form>
                <button onClick={()=> {
                    createConcept()
                    setShowForm(false)
                }}>Add</button>
            </div>
             :
            <button color="primary" onClick={() => {
                setShowForm(true)
                addConceptForm()}}
            >Add New Concept</button>
            }
            
            {concepts ? concepts.filter(f=>{
                let actionlist = f.actions.map(m=> m.action);
                return (actionlist.indexOf('deleted') === -1 && actionlist.indexOf('merged') === -1);
            }).map((con: ConceptType, i) => (
                <div
                    key={con.name}
                    style={{
                    display: 'grid',
                    gridTemplateColumns: '200px 100px 100px',
                    }}
                    >
                    <h3>{con.name}</h3>
                    {/* <button>Merge</button> */}
                    <button onClick={()=> dispatch({ type: 'DELETE_CONCEPT', title: con })}>Delete</button>
                    <Merger conceptList={conceptList} concept={con} index={i} ></Merger>
                    
                </div>
            )) : <div>no concepts</div>}
        </div>
        </>
    )
};

export default ConceptNav;
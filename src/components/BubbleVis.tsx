import path from 'path';
import * as d3 from 'd3';
import React, { useEffect, useState } from 'react';
import { useProjectState } from './ProjectContext';
import ForceMagic from '../ForceMagic';
import Bubbles from '../Bubbles';
import VerticalAxis from './VerticalAxis';
import type { EntryType } from './types';
import { Box, Button, FormControl, FormLabel, Spacer, Switch } from '@chakra-ui/react';
import { calcCircles } from '../PackMagic';
import { MdSelectAll } from 'react-icons/md';



interface BubbleProps {
  filteredActivities: EntryType[];
  setGroupBy:(gb:any)=> void;
  groupBy: any;
  setSplitBubbs: (b:boolean)=> void;
  splitBubbs: boolean;
  setHoverActivity: (ent: any) => void;
  flexAmount: number;
  setDefineEvent: (value: ((prevState: boolean) => boolean) | boolean) => void;
  defineEvent: boolean;
}

const BubbleVis = (props: BubbleProps) => {
  const {
    filteredActivities,
    groupBy,
    setGroupBy,
    splitBubbs,
    setSplitBubbs,
    setHoverActivity,
    flexAmount,
    setDefineEvent,
    defineEvent,
  } = props;

  const [
    { artifactTypes, selectedThread, researchThreads, folderPath, projectData, filterRT },
  ] = useProjectState();
  
  const {eventArray} = projectData;

  const [newHeight, setNewHeight] = useState('1000px');
  const [translateY, setTranslateY] = useState(35);

  const width = 200;
  const height = +newHeight.split('px')[0];

  const svgRef = React.useRef(null);

  let packedCircData = calcCircles(projectData.entries);

  const checktool = d3.select('#tooltip');

  const div = checktool.empty()
    ? d3
        .select('body')
        .append('div')
        .attr('id', 'tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('text-align', 'center')
        .attr('width', 60)
        .attr('height', 2)
        .style('padding', '10px')
        .style('font', '12px sans-serif')
        .style('background', 'white')
        .style('border', '2px solid gray')
        .style('border-radius', '10px')
        .style('pointer-events', 'none')
    : checktool;

  const forced = new ForceMagic(packedCircData, width, height, splitBubbs);

  useEffect(() => {
    if (svgRef.current) {
      setNewHeight(window.getComputedStyle(svgRef.current).height);
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const underWrap = svg.append('g').classed('path-wrap', true)
    underWrap.attr('transform', `translate(0, ${translateY})`);//.attr('transform', .attr('transform', `translate(0, ${translateY})`);)
    const wrap = svg.append('g').attr('transform', `translate(0, ${translateY})`);
    const { yScale, margin } = forced;
    setTranslateY(margin / 3);

    const eventRectGroups = wrap
    .selectAll('g.event')
    .data(eventArray)
    .join('g')
    .classed('event', true);

    if (eventArray.length > 0) {

        eventRectGroups.attr('transform', (d)=> `translate(0, ${yScale(new Date(d.time[0]))})`)
        const eventRects = eventRectGroups.selectAll('rect').data(d => [d]).join('rect');

        eventRects.attr(
        'height',
        (d: any) => yScale(new Date(d.time[1])) - yScale(new Date(d.time[0]))
        );

        eventRects.attr('width', 600);
        eventRects.style('fill-opacity', 0.05);

        if(!groupBy){
          let eventText = eventRectGroups
          .selectAll('text')
          .data((d) => [d])
          .join('text')
          .text((d) => d.event);
  
          eventText.attr('x', 200);
          eventText.style('font-size', 10);
          eventText.style('fill', 'gray');
        }
     
    }

    const nodes = forced.nodes.filter((f: any) => {
      if (splitBubbs) {
        return filteredActivities.map((m: any) => m.title).includes(f.activityTitle);
      }
      return filteredActivities.map((m: any) => m.title).includes(f.title);
    });

    if (groupBy) {
      // const highlightedForFirst = forced.nodes.filter((f: any) =>
      //   filteredActivities.map((m: any) => m.title).includes(f.title)
      // );
      // const notHighlightedForFirst = forced.nodes.filter(
      //   (f: any) => filteredActivities.map((m: any) => m.title).indexOf(f.title) == -1
      // );

      
    
      if (groupBy.type === 'research_threads') {

        const groupRTDATA = groupBy.data.map((m: any) => {
          console.log(m)
          return { label: m.title, color: m.color };
        });

       

        const groupGroups = wrap
          .selectAll('g.group')
          .data(groupRTDATA)
          .join('g')
          .attr('class', 'group');

        groupGroups.attr('transform', (d: any, i: any) => `translate(${i * 200}, 0)`);

        let allActivityGroups = groupGroups
        .selectAll('g.activity')
        .data(forced.nodes)
        .join('g')
        .attr('class', 'activity');

      allActivityGroups.attr('transform', d => `translate(${d.x}, ${d.y})`);


      let underGroup = groupGroups.append('g');

      // allActivityGroups.attr('transform', d => `translate(${d.x}, ${d.y})`);

      let activityBubbles = new Bubbles(
        allActivityGroups,
        true,
        'all-activities'
      );

      activityBubbles.bubbles.attr('fill', "#fff").attr('fill-opacity', .2).attr('stroke', '#d3d3d3').attr('stroke-width', .2);
      let artifactCircles = allActivityGroups.selectAll('circle.artifact').data(d => d.files).join('circle').classed('artifact', true);
      artifactCircles.attr('r', d => (d.r - 1)).attr('cx', d => d.x).attr('cy', d => d.y);

      let highlightedActivities = allActivityGroups.filter((ac) => filteredActivities.map((m:any) => m.title).includes(ac.title));
      
    

      groupGroups.each((d, i, n)=> {
        console.log('each', d3.select(n[i]));
        let chosenRT = researchThreads?.research_threads.filter(f => f.title === d.label)[0];
        let rtActivities = chosenRT.evidence.map(m => m.activityTitle);
        let colorCirc = d3.select(n[i]).selectAll('circle.all-activities').filter(c => rtActivities.includes(c.title));
        colorCirc.attr('fill', d.color);

        let notColA = d3.select(n[i]).selectAll('.activity').filter(c => rtActivities.indexOf(c.title) === -1);
        notColA.selectAll('.artifact').attr('fill', '#d3d3d3');
        let notCol = d3.select(n[i]).selectAll('circle.all-activities').filter(c => rtActivities.indexOf(c.title) === -1);
        notCol.attr('fill', '#d3d3d3');
      })

      }
    } else {

      let allActivityGroups = wrap
        .selectAll('g.activity')
        .data(forced.nodes)
        .join('g')
        .attr('class', 'activity');

      allActivityGroups.attr('transform', d => `translate(${d.x}, ${d.y})`);

      let activityBubbles = new Bubbles(
        allActivityGroups,
        true,
        'all-activities'
      );

      activityBubbles.bubbles.attr('fill', "#fff").attr('fill-opacity', .2).attr('stroke', '#d3d3d3').attr('stroke-width', .2);
      
      //.attr("stroke" ,'gray').attr('stroke-width', .5).attr('stroke-dasharray', "2,2");
      
      let artifactCircles = allActivityGroups.selectAll('circle.artifact').data(d => d.files).join('circle').classed('artifact', true);
      artifactCircles.attr('r', d => (d.r - 1)).attr('cx', d => d.x).attr('cy', d => d.y);

      let highlightedActivities = allActivityGroups.filter((ac) => filteredActivities.map((m:any) => m.title).includes(ac.title));
      highlightedActivities.select('.all-activities')
      .on('mouseover', (event, d) => {
        d3.select(event.target).attr('fill', 'gray');
      }).on('mouseout', (event, d) => {
        d3.select(event.target).attr('fill', '#fff');
      });

      let highlightedCircles = highlightedActivities.selectAll('circle.artifact');

      highlightedCircles.attr('fill', 'gray');

      highlightedCircles.on('mouseover', (event, d) => {
        console.log('WHAT IS THIS', d);
      });

      let hiddenCircles = allActivityGroups.filter(ac => {
        return filteredActivities.map((m:any) => m.title).indexOf(ac.title) === -1})
      .selectAll('circle.artifact');

      hiddenCircles.attr('fill', 'gray').attr('fill-opacity', .3);

      if(filterRT){
        let tagChecker = [...filterRT.associatedKey].filter(at => filterRT.key.indexOf(at) === -1);

        let linkData = [];
        researchThreads?.research_threads[selectedThread].evidence.forEach(f => {
          let temp = highlightedActivities.filter(ha => ha.title === f.activityTitle);
        
        let chosenActivityData = temp.select('.all-activities').data()[0];
        console.log('temp', temp)

        if(f.type === 'activity'){
          temp.select('.all-activities').attr('fill', researchThreads?.research_threads[selectedThread].color);
        
        }else if(f.type === 'artifact' || f.type === 'fragment'){
      
          let artifactCoord = temp.selectAll('circle.artifact').filter(art => art.title === f.artifactTitle);
          temp.select('circle.background').attr('fill-opacity', 1);
          temp.selectAll('circle.artifact').filter(art => art.title === f.artifactTitle).attr('fill', researchThreads?.research_threads[selectedThread].color);
          temp.select('circle.all-activities').attr('fill', researchThreads?.research_threads[selectedThread].color)
          
          let adjustedX = (+artifactCoord.attr('cx') < 0) ? (chosenActivityData.x - artifactCoord.attr('cx')) : (chosenActivityData.x + artifactCoord.attr('cx'));
          let adjustedY = (+artifactCoord.attr('cy') < 0) ? (chosenActivityData.y - artifactCoord.attr('cy')) : (chosenActivityData.y - (artifactCoord.attr('cy')));
          // console.log('adjusted Y??', adjustedY, 'chosenactivity', chosenActivityData.y, artifactCoord.attr('cy'));
          linkData.push({coord: [chosenActivityData.x, chosenActivityData.y], date: chosenActivityData.date})
        }
      })

      console.log('highlighted activities', researchThreads?.research_threads[selectedThread], filterRT)
      
      var lineGenerator = d3.line();
      linkData = linkData.sort((a, b) => new Date(a.date) - new Date(b.date))
      var pathString = lineGenerator(linkData.map(m=> m.coord));

      underWrap.append('path')
        .attr('d', pathString)
        .attr('fill', 'none')
        .attr('stroke', 'gray')
        .attr('stroke-width', 1);
    }

    highlightedActivities
        .on('mouseover', (event, d) => {
          d3.select(event.target).select('.all-activities')
            .attr('r', d.radius * 1.3)
            // .attr('stroke', '#fff')
            // .attr('stroke-width', 2)

          setHoverActivity(d);

          const htmlForm = () => {
            let start = `<div style="margin-bottom:10px; font-weight:700">${d.title} <br/>
                                    ${d.date} <br/></div>`;
            if (!splitBubbs) {
              if (selectedThread != null) {
                const test = researchThreads.research_threads[
                  selectedThread
                ].evidence.filter((f) => f.activityTitle === d.title);

                if (test.length > 0) {
                  test.forEach((t) => {
                    const type =
                      t.type === 'fragment' ? 'Fragment of Artifact' : t.type;
                    const artifactTitle =
                      t.type === 'fragment' || t.type === 'artifact'
                        ? `: ${t.artifactTitle}`
                        : '';
                    start += `<div><span style="font-weight:700; font-size:14px">${type}</span>${artifactTitle}</div></br>`;
                    if (t.type === 'fragment') {
                      t.anchors.map((an:any) => {
                        if (an.anchor_type === 'text') {
                          start += `<div style="margin-bottom:10px">${an.frag_type}</div>`;
                        }
                      });
                    }
                    start += `<div>Rationale: ${t.rationale}<div>`;

                    if (t.artifactTitle.includes('.png')) {
                      start += `<img src="${path.join(
                        folderPath,
                        t.artifactTitle
                      )}" style="width:500px; height:auto"
                                    />`;
                    }
                  });
                } else {
                  start += `</br>
                    <span>This activity is tagged with a tag associated with the research thread <span style="font-weight:700">${researchThreads.research_threads[selectedThread].title}</span>`;
                }

                start += `</div>`;
                return start;
              }
              d.files.forEach((f:any) => {
                start += `<div><span style="font-weight:700; font-size:14px">${f.artifactType}:  </span>${f.title}</div>`;
              });
            } else {
              console.log('dis a file', d);
            }
            return start;
          };

          div.transition().duration(200).style('opacity', 0.9);
          div
            .html(htmlForm)
            .style('left', `${event.pageX}px`)
            .style('top', `${event.pageY - 28}px`);
        })
        .on('mouseout', (event:any, d:any) => {
          d3.select(event.target).attr('r', d.radius)
          //.attr('stroke-width', 0);
          div.transition().duration(500).style('opacity', 0);
        });

    // }
      }

  }, [filteredActivities, groupBy, splitBubbs, eventArray]);

  return (
    <div style={{ flex: flexAmount, paddingTop:'10px' }}>
      <div
        style={{width:'100%'}}
      >
        <Button
          size={'sm'}
          style={{fontSize:"12px"}}
          onClick={() =>
            defineEvent ? setDefineEvent(false) : setDefineEvent(true)
          }
        >
          Add events to timeline
        </Button>
       
        <Box marginLeft="50px" padding="3px" height="30px" display={'inline-block'}>
        <FormControl display="flex" alignItems="center" marginBottom={10}>
          <FormLabel
            htmlFor="split-by"
            mb="0"
            textAlign="right"
            fontSize="12px"
          >
            Split bubbles to artifacts
          </FormLabel>
          <Switch
            id="split-by"
            onChange={(event) => {
              event.target.checked ? setSplitBubbs(true) : setSplitBubbs(false);
            }}
          />
        </FormControl>
      </Box>
      <Box marginLeft="3px" padding="3px" height="40px" display={'inline-block'}>
        <FormControl display="flex" alignItems="center" marginBottom={10}>
          <FormLabel
            htmlFor="split-by"
            mb="0"
            textAlign="right"
            fontSize="12px"
          >
            Group by research threads
          </FormLabel>
          <Switch
            id="split-by"
            onChange={(event) => {
              event.target.checked
                ? setGroupBy({
                    type: 'research_threads',
                    data: researchThreads.research_threads,
                  })
                : setGroupBy(null);
            }}
          />
        </FormControl> 
      </Box>
           
      </div>
      <VerticalAxis
        filteredActivities={filteredActivities}
        height={height}
        setDefineEvent={setDefineEvent}
        defineEvent={defineEvent}
        yScale={forced.yScale}
        translateY={translateY}
      />
      <svg
        ref={svgRef}
        width="calc(100% - 160px)"
        // width="500px"
        height={height}
        style={{ display: 'inline' }}
      />
    </div>
  );
};

export default BubbleVis;

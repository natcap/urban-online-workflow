import React, { useState, useEffect } from 'react';

import {
  HTMLTable,
  Button
} from '@blueprintjs/core';

export default function ScenarioTable(props) {
  // const { savedScenarios } = props;

  const [lulcNames, setLulcNames] = useState([]);

  // useEffect(async () => {
  //   const lulcCodes = await getLulcCodes();
  //   setLulcNames(Object.values(lulcCodes));
  // }, []);

  // if (!savedScenarios || !savedScenarios.length) {
  //   return <p>No scenarios have been created</p>;
  // }

  // const lulcHeader = (
  //   <tr key="header">
  //     <td key="header"> </td>
  //     {lulcNames.map((type) => <td key={type}>{type}</td>)}
  //   </tr>
  // );

  // const rows = [];
  // rows.push(lulcHeader);
  // savedScenarios.forEach((scen) => {
  //   rows.push(
  //     <tr key={scen.name}>
  //       <td key={scen.name}><em><b>{scen.name}</b></em></td>
  //       {lulcNames.map((type) => <td key={type}> </td>)}
  //     </tr>,
  //   );
    // Uncomment when https://github.com/natcap/urban-online-workflow/issues/40 is fixed
    // Object.values(scen.features).forEach((feature) => {
    //   rows.push(
    //     <tr key={feature.fid}>
    //       <td key={feature.fid}>{feature.fid}</td>
    //       {lulcNames.map((type) => <td key={type}>{feature.table[type]}</td>)}
    //     </tr>,
    //   );
    // });
  // });

  return (
    <>
    <HTMLTable bordered striped className="scenario-table">
      <tbody>
        <tr>
          <td></td>
          <td>Developed, Open Space</td>
          <td>Developed, Low Intensity</td>
          <td>Shrub/Scrub</td>
          <td>Evergreen Forest</td>
        </tr>
        <tr>
          <th>Baseline</th>
          <th>8 km<sup>2</sup></th>
          <th>0.9 km<sup>2</sup></th>
          <th>0.1 km<sup>2</sup></th>
          <th>0 km<sup>2</sup></th>
        </tr>
        <tr>
          <td>21 Ellison Dr</td>
          <td>6.5</td>
          <td>0</td>
          <td>0</td>
          <td>0</td>
        </tr>
        <tr>
          <td>9 Marbach Dr</td>
          <td>1.5</td>
          <td>0</td>
          <td>0</td>
          <td>0</td>
        </tr>
        <tr>
          <td>3 Ellison Blvd</td>
          <td>0</td>
          <td>0.9</td>
          <td>0.1</td>
          <td>0</td>
        </tr>
        <tr>
          <th>Reforestation</th>
          <th>0.1 km<sup>2</sup></th>
          <th>0.9 km<sup>2</sup></th>
          <th>1.5 km<sup>2</sup></th>
          <th>6.5 km<sup>2</sup></th>
        </tr>
        <tr>
          <td>21 Ellison Dr</td>
          <td>0.1</td>
          <td>0</td>
          <td>1.2</td>
          <td>5.2</td>
        </tr>
        <tr>
          <td>9 Marbach Dr</td>
          <td>0</td>
          <td>0</td>
          <td>0.3</td>
          <td>1.2</td>
        </tr>
        <tr>
          <td>3 Ellison Blvd</td>
          <td>0</td>
          <td>0.9</td>
          <td>0</td>
          <td>0.1</td>
        </tr>
      </tbody>
    </HTMLTable>
    <br />
    <Button>
      Run InVEST Models
    </Button>
    </>
  );
}

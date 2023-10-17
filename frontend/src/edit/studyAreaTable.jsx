import React, { useState } from 'react';

import {
  Button,
  HTMLTable,
} from '@blueprintjs/core';

import { removeParcel } from '../requests';

export default function StudyAreaTable(props) {
  const {
    parcelArray,
    refreshStudyArea,
    studyAreaID,
    immutableStudyArea,
    setHoveredParcel,
  } = props;
  const [hiddenRowClass, setHiddenRowClass] = useState('');

  const deleteParcel = async (parcelID) => {
    await removeParcel(parcelID, studyAreaID);
    refreshStudyArea();
  };

  const toggleRows = () => {
    if (hiddenRowClass) {
      setHiddenRowClass('');
    } else {
      setHiddenRowClass('hidden-row');
    }
  };

  const rows = [];
  rows.push(
    <tr key="header">
      <td>
        <Button
          icon={hiddenRowClass ? 'Maximize' : 'Minimize'}
          onClick={toggleRows}
        />
      </td>
      <td className="parcel-address"><em>address</em></td>
      <td><em>landuse</em></td>
      <td><em>landcover</em></td>
      <td><em>tree cover</em></td>
      <td><em>% of area</em></td>
    </tr>,
  );
  parcelArray.forEach((parcel) => {
    let lulcData = JSON.parse(parcel.parcel_stats.lulc_stats);
    if (!lulcData) {
      lulcData = {};
    }
    const sorted = Object.entries(lulcData)
      .sort(([, a], [, b]) => b - a);
    const sortedClasses = sorted.map((x) => x[0]);
    const sortedValues = sorted.map((x) => x[1]);
    const total = sortedValues.reduce((partial, a) => partial + a, 0);
    let x = 0;
    let i = 0;
    while (x < total * 1.0) {
      x += sortedValues[i];
      i++;
    }
    const topClasses = sortedClasses.slice(0, i);
    rows.push(topClasses.map((x, i) => {
      let header = <td />;
      let address = <td />;
      let rowClass = '';
      if (i == 0) {
        header = (
          <td>
            <Button
              icon="remove"
              onClick={() => deleteParcel(parcel.parcel_id)}
              disabled={immutableStudyArea}
            />
          </td>
        );
        address = <td className="parcel-address">{parcel.address}</td>;
        rowClass = 'address-row';
      }
      const data = JSON.parse(x);
      const pct = sortedValues[i] / total * 100;
      return (
        <tr
          className={rowClass.concat(' ', hiddenRowClass)}
          key={i}
          onMouseOver={() => setHoveredParcel(parcel.parcel_id)}
          onFocus={() => setHoveredParcel(parcel.parcel_id)}
          onMouseOut={() => setHoveredParcel(null)}
          onBlur={() => setHoveredParcel(null)}
        >
          {header}
          {address}
          <td>{data.nlud2}</td>
          <td>{data.nlcd}</td>
          <td>{data.tree}</td>
          <td>{Math.round(pct)}</td>
        </tr>
      );
    }));
  });

  return (
    <div>
      <HTMLTable
        className="study-area-table bp4-html-table-condensed"
      >
        <tbody>
          {rows}
        </tbody>
      </HTMLTable>
    </div>
  );
}

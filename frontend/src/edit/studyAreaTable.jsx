import React, { useState } from 'react';

import {
  Button,
  HTMLSelect,
  HTMLTable,
} from '@blueprintjs/core';

import { removeParcel } from '../requests';
import { toAcres } from '../utils';

import landuseCodes from '../../../appdata/overlay_simple_crosswalk.json';

const LULC_TYPES = {
  'nlcd': 'landcover',
  'nlud': 'landuse',
  'tree': 'tree cover'
};

export default function StudyAreaTable(props) {
  const {
    parcelArray,
    refreshStudyArea,
    studyAreaID,
    immutableStudyArea,
    setHoveredParcel,
  } = props;
  const [hiddenRowClass, setHiddenRowClass] = useState('');
  const [lulcType, setLulcType] = useState('nlcd');

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

  function sortCounts(countsMap) {
    return Object.entries(countsMap)
      .sort(([, a], [, b]) => b - a);
  }

  const headerRow = (
    <tr key="header">
      <td>
        <Button
          icon={hiddenRowClass ? 'Maximize' : 'Minimize'}
          onClick={toggleRows}
        />
      </td>
      <td className="parcel-address"><em>address</em></td>
      <td>
        <HTMLSelect
          onChange={(event) => setLulcType(event.target.value)}
          value={lulcType}
        >
          {Object.entries(LULC_TYPES).map(
            ([type, label]) => <option key={type} value={type}>{label}</option>
          )}
        </HTMLSelect>
      </td>
      <td><em>acres</em></td>
    </tr>
  );
  const rows = [];
  rows.push(headerRow);

  parcelArray.forEach((parcel) => {
    const data = JSON.parse(parcel.parcel_stats.lulc_stats);
    if (!data) { return; }
    const sorted = sortCounts(data[lulcType]);
    rows.push(sorted.map(([label, count], i) => {
      let header = <td />;
      let address = <td />;
      let rowClass = '';
      if (i === 0) {
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
      return (
        <tr
          className={rowClass.concat(' ', hiddenRowClass)}
          key={label}
          onMouseOver={() => setHoveredParcel(parcel.parcel_id)}
          onFocus={() => setHoveredParcel(parcel.parcel_id)}
          onMouseOut={() => setHoveredParcel(null)}
          onBlur={() => setHoveredParcel(null)}
        >
          {header}
          {address}
          <td>{label}</td>
          <td>{toAcres(count)}</td>
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

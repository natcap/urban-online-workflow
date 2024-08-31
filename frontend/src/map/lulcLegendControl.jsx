import React, { useState } from 'react';

import { HTMLSelect } from '@blueprintjs/core';

import landuseCodes from '../../../appdata/lulc_crosswalk.json';
import nlcdLookup from '../../../appdata/nlcd_colormap.json';
import nludLookup from '../../../appdata/nlud_colormap.json';
import treeLookup from '../../../appdata/tree_colormap.json';

const LULC_LOOKUP = {
  nlcd: nlcdLookup,
  nlud: nludLookup,
  tree: treeLookup,
};

const LULC_TYPES = {
  nlcd: 'landcover',
  nlud: 'landuse',
  tree: 'tree cover',
};

export default function LULCLegendControl(props) {
  const {
    lulcCode,
    setLulcStyle,
    show,
  } = props;

  const [lulcType, setLulcType] = useState('nlcd');

  const changeLulc = (event) => {
    setLulcType(event.target.value);
    setLulcStyle(event.target.value);
  };

  return (
    <div>
      {
        (show)
          ? (
            <div className="map-legend map-lulc-legend lulc-legend">
              <HTMLSelect
                onChange={changeLulc}
                value={lulcType}
              >
                {Object.entries(LULC_TYPES).map(
                  ([type, label]) => <option key={type} value={type}>{label}</option>
                )}
              </HTMLSelect>
              {
                (lulcCode)
                  ? (
                    <>
                      <div
                        style={{
                          backgroundColor: LULC_LOOKUP[lulcType][landuseCodes[lulcCode][lulcType]].color,
                          width: '20px',
                          height: '20px',
                          display: 'inline-block',
                          margin: '0.5em',
                        }}
                      />
                      <span>{LULC_LOOKUP[lulcType][landuseCodes[lulcCode][lulcType]].name}</span>
                    </>
                  )
                  : <div />
              }
            </div>
          )
          : <div />
      }
    </div>
  );
}

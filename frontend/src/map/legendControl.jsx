import React, { useState } from 'react';

import landuseCodes from '../../../appdata/NLCD_2016.lulcdata.json';


export default function LegendControl(props) {
  const {
    lulcCode,
  } = props;


  return (
    <div>
      {
        (lulcCode)
          ? (
              // <div className="map-lulc-legend lulc-legend">
              //   <div
              //     style={{
              //       backgroundColor: landuseCodes[lulcCode].color,
              //       width: '20px',
              //       height: '20px',
              //       display: 'inline-block',
              //       margin: '0.5em',
              //     }}
              //   />
              //   <span>{landuseCodes[lulcCode].name}</span>
              // </div>
              <div className="map-lulc-legend lulc-legend">{lulcCode}</div>
          )
          : <div />
      }
    </div>
  );
}

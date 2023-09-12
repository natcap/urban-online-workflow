import React, { useEffect, useState } from 'react';

import {
  HTMLSelect,
} from '@blueprintjs/core';

import {
  getNLUDTier2,
  getNLUDTier3,
  getNLCD,
  getLucode,
} from '../requests';

const treeOptions = ['none', 'low', 'medium'];

export default function LulcMenu(props) {
  const [nlud2Options, setNlud2Options] = useState([]);
  const [nlud3Options, setNlud3Options] = useState([]);
  const [nlcdOptions, setNlcdOptions] = useState([]);
  const [nlud2, setNlud2] = useState(null);
  const [nlud3, setNlud3] = useState(null);
  const [nlcd, setNlcd] = useState(null);
  const [tree, setTree] = useState(treeOptions[0]);

  useEffect(() => {
    (async () => {
      const options = await getNLUDTier2();
      setNlud2Options(options);
      setNlud2(options[0]);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (nlud2) {
        const options = await getNLUDTier3(nlud2);
        setNlud3Options(options);
        setNlud3(options[0]);
      }
    })();
  }, [nlud2]);

  useEffect(() => {
    (async () => {
      if (nlud2 && nlud3) {
        const options = await getNLCD(nlud2, nlud3);
        setNlcdOptions(options);
        setNlcd(options[0]);
      }
    })();
  }, [nlud2, nlud3]);

  useEffect(() => {
    if (nlud2 && nlud3 && nlcd && tree) {
      (async () => {
        const code = await getLucode(nlud2, nlud3, nlcd, tree);
        console.log(code);
        props.setLucode(code);
      })();
    }
  }, [nlud2, nlud3, nlcd, tree]);

  if (nlud2Options) {
    return (
      <div id="landuse-select-form">
        <label className="lulc-select">
          <p>Landuse type:</p>
          <HTMLSelect
            onChange={(event) => setNlud2(event.target.value)}
          >
            {nlud2Options.map((name) => <option key={name} value={name}>{name}</option>)}
          </HTMLSelect>
          <label id="nlud-subtype">
            subtype:
            <HTMLSelect
              onChange={(event) => setNlud3(event.target.value)}
            >
              {nlud3Options.map((name) => <option key={name} value={name}>{name}</option>)}
            </HTMLSelect>
          </label>
        </label>
        <label className="lulc-select">
          <p>Landcover:</p>
          <HTMLSelect
            onChange={(event) => setNlcd(event.target.value)}
          >
            {nlcdOptions.map((name) => <option key={name} value={name}>{name}</option>)}
          </HTMLSelect>
        </label>
        <label className="lulc-select">
          <p>Tree Cover:</p>
          <HTMLSelect
            onChange={(event) => setTree(event.target.value)}
          >
            {treeOptions.map((name) => <option key={name} value={name}>{name}</option>)}
          </HTMLSelect>
        </label>
      </div>
    );
  }
}

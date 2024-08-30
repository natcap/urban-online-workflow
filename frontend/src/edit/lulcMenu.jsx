import React, { useEffect, useState } from 'react';

import {
  HTMLSelect,
} from '@blueprintjs/core';

import {
  getNLUDTier2,
  getNLUDTier3,
  getNLCD,
  getTreeCover,
  getLucode,
} from '../requests';

export default function LulcMenu(props) {
  const [nlud2Options, setNlud2Options] = useState([]);
  const [nlud3Options, setNlud3Options] = useState([]);
  const [nlcdOptions, setNlcdOptions] = useState([]);
  const [treeOptions, setTreeOptions] = useState([]);
  const [nlud2, setNlud2] = useState(null);
  const [nlud3, setNlud3] = useState(null);
  const [nlcd, setNlcd] = useState(null);
  const [tree, setTree] = useState(null);

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
      if ([nlud2, nlud3].every((x) => typeof x === 'string')) {
        const options = await getNLCD(nlud2, nlud3);
        setNlcdOptions(options);
        setNlcd(options[0]);
      }
    })();
  }, [nlud2, nlud3]);

  useEffect(() => {
    (async () => {
      if ([nlud2, nlud3, nlcd].every((x) => typeof x === 'string')) {
        const options = await getTreeCover(nlud2, nlud3, nlcd);
        setTreeOptions(options);
        setTree(options[0]);
      }
    })();
  }, [nlud2, nlud3, nlcd]);

  useEffect(() => {
    if ([nlud2, nlud3, nlcd, tree].every((x) => typeof x === 'string')) {
      (async () => {
        const code = await getLucode(nlud2, nlud3, nlcd, tree);
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
            value={nlud2}
          >
            {nlud2Options.map((name) => <option key={name} value={name}>{name}</option>)}
          </HTMLSelect>
          <label id="nlud-subtype">
            subtype:
            <HTMLSelect
              onChange={(event) => setNlud3(event.target.value)}
              value={nlud3}
            >
              {nlud3Options.map((name) => <option key={name} value={name}>{name}</option>)}
            </HTMLSelect>
          </label>
        </label>
        <label className="lulc-select">
          <p>Landcover:</p>
          <HTMLSelect
            onChange={(event) => setNlcd(event.target.value)}
            value={nlcd}
          >
            {nlcdOptions.map((name) => <option key={name} value={name}>{name}</option>)}
          </HTMLSelect>
        </label>
        <label className="lulc-select">
          <p>Tree Cover:</p>
          <HTMLSelect
            onChange={(event) => setTree(event.target.value)}
            value={tree}
          >
            {treeOptions.map((name) => <option key={name} value={name}>{name}</option>)}
          </HTMLSelect>
        </label>
      </div>
    );
  }
}

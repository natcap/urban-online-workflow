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
        console.log(code)
        props.setLucode(code);
      })();
    }
  }, [nlud2, nlud3, nlcd, tree]);

  if (nlud2Options) {
    return (
      <div id="landuse-select-form">
        <label className="lulc-select">
          Landuse type:
          <HTMLSelect
            onChange={(event) => setNlud2(event.target.value)}
            value={nlud2}
            iconName="caret-down"
          >
            {nlud2Options.map((name) => <option key={name} value={name}>{name}</option>)}
          </HTMLSelect>
        </label>
        <label className="lulc-select" id="nlud-subtype">
          Landuse subtype:
          <HTMLSelect
            onChange={(event) => setNlud3(event.target.value)}
            value={nlud3}
            iconName="caret-down"
          >
            {nlud3Options.map((name) => <option key={name} value={name}>{name}</option>)}
          </HTMLSelect>
        </label>
        <label className="lulc-select">
          Landcover:
          <HTMLSelect
            onChange={(event) => setNlcd(event.target.value)}
            value={nlcd}
            iconName="caret-down"
          >
            {nlcdOptions.map((name) => <option key={name} value={name}>{name}</option>)}
          </HTMLSelect>
        </label>
        <label className="lulc-select">
          Tree Cover:
          <HTMLSelect
            onChange={(event) => setTree(event.target.value)}
            value={tree}
            iconName="caret-down"
          >
            {treeOptions.map((name) => <option key={name} value={name}>{name}</option>)}
          </HTMLSelect>
        </label>
      </div>
    );
  }
}

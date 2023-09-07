import React, { useEffect, useState } from 'react';

import {
  getNLUDTier2,
  getNLUDTier3,
  getNLCD,
} from '../requests';

export default function LulcMenu(props) {
  const [nlud2Options, setNlud2Options] = useState([]);
  const [nlud3Options, setNlud3Options] = useState([]);
  const [nlcdOptions, setNlcdOptions] = useState([]);
  const [nlud2, setNlud2] = useState(null);
  const [nlud3, setNlud3] = useState(null);
  const [nlcd, setNlcd] = useState(null);
  const [tree, setTree] = useState(null);

  useEffect(() => {
    (async () => {
      const options = await getNLUDTier2();
      setNlud2Options(options);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const options = await getNLUDTier3(nlud2);
      setNlud3Options(options);
    })();
  }, [nlud2]);

  useEffect(() => {
    (async () => {
      const options = await getNLCD(nlud2, nlud3);
      setNlcdOptions(options);
    })();
  }, [nlud2, nlud3]);

  useEffect(() => {
    if (nlud2 && nlud3 && nlcd && tree) {
      props.setLucode(nlud2, nlud3, nlcd, tree);
    }
  }, [nlud2, nlud3, nlcd, tree]);

  return (
    <>
      <HTMLSelect
        onChange={(event) => setNlud2(event.target.value)}
      >
        {nlud2Options.map((name) => <option key={name} value={name}>{name}</option>)}
      </HTMLSelect>
      <HTMLSelect
        onChange={(event) => setNlud3(event.target.value)}
      >
        {nlud3Options.map((name) => <option key={name} value={name}>{name}</option>)}
      </HTMLSelect>
      <HTMLSelect
        onChange={(event) => setNlcd(event.target.value)}
      >
        {nlcdOptions.map((name) => <option key={name} value={name}>{name}</option>)}
      </HTMLSelect>
      <HTMLSelect
        onChange={(event) => setTree(event.target.value)}
      >
        {['none', 'low', 'medium'].map((name) => <option key={name} value={name}>{name}</option>)}
      </HTMLSelect>
    </>
  );
}

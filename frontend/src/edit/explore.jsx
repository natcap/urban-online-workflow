import React, { useState, useEffect } from 'react';

import {
  Button,
  Section,
  SectionCard,
} from '@blueprintjs/core';

import EquityLegend from '../map/equityLegend';

const INTRO_TEXT = `
San Antonio, TX is hot. Some neighborhoods are hotter than others.
Explore environmental inequalities with respect to concentrations of
Black, Indigenous, and People of Color (BIPOC) and to
income levels.`;

const ECO_TEXT = `
Characteristics of the natural and built environment influence
the urban heat island. Buildings and dark-colored pavement absorb heat.
Trees provide shade, and vegetation provides some natural air-conditioning
through the cooling effect of evapotranspiration.`;

const SCENARIO_TEXT = `
This tool is designed to let you build scenarios of different
landcover, tree-cover, and landuse management. And then evaluate
how these scenarios impact urban heating, access to nature, and 
carbon sequestration.`;

export default function Explore(props) {
  const {
    startBuilding,
    equityLayerTitle,
  } = props;
  return (
    <div id="explore" data-testid="explore">
      <Section>
        <SectionCard>{INTRO_TEXT}</SectionCard>
        <SectionCard>
          <EquityLegend
            show={true}
            equityLayerTitle={equityLayerTitle}
          />
        </SectionCard>
        <SectionCard>{ECO_TEXT}</SectionCard>
        <SectionCard>
          {SCENARIO_TEXT}
        </SectionCard>
        <SectionCard>
          <Button onClick={startBuilding}>Start building scenarios</Button>
        </SectionCard>
      </Section>
    </div>
  );
}

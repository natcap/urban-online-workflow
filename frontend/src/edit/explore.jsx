import React, { useState, useEffect } from 'react';

import {
  Button,
  Section,
  SectionCard,
} from '@blueprintjs/core';

import EquityLegend from '../map/equityLegend';

const INTRO_TEXT = `
San Antonio, TX faces the challenge of staying cool in its hot climate, 
but not all neighborhoods receive equal help from nature. Some areas benefit 
more from natural cooling than others, highlighting environmental inequities, 
especially in neighborhoods with higher concentrations of Black, Indigenous, 
and People of Color (BIPOC) and lower income levels. Explore how these 
disparities affect the city’s ability to cope with rising temperatures.`;

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

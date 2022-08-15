import React from 'react';

import { Drawer } from '@blueprintjs/core';

export default function PatternCatalogDrawer(props) {
  
  return (
    <Drawer
      isOpen={props.open}
      onClose={props.closeDrawer}
      title="Wallpaper pattern catalog"
    >
      hello!
    </Drawer>
  );
}

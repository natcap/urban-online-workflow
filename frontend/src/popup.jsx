import {toStringHDMS} from 'ol/coordinate';
import {toLonLat} from 'ol/proj';
import React, { useState, useEffect, useRef } from 'react';


export default function PopupComponent(props) {
  const {
    location,
    message,
    overlay,
    toggleEditMenu
  } = props;

  const closerElement = useRef();

  useEffect(() => {
    /**
     * Add a click handler to hide the popup.
     * @return {boolean} Don't follow the href.
     */
    closerElement.current.onclick = function () {
      overlay.setPosition(undefined);
      closerElement.current.blur();
      return false;
    };

    overlay.setPosition(location);

  });

  return (
    <>
      <a ref={closerElement} href="#" id="popup-closer" className="ol-popup-closer"></a>
      <div id="popup-content">{message}</div>
      <button
        onClick={() => {
          console.log('button clicked');
          toggleEditMenu()
        }}>
        Edit
      </button>
    </>
  );
}
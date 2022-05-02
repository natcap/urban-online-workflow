import {toStringHDMS} from 'ol/coordinate';
import {toLonLat} from 'ol/proj';
import React, { useState, useEffect } from 'react';


export default function PopupComponent(props) {
  const {
    location,
    message,
    overlay,
    toggleEditMenu
  } = props;

  useEffect(() => {
    overlay.setPosition(location);
  });

  return (
    <>
      <button
        onClick={() => {
          overlay.setPosition(undefined);
          return false;
        }}
        href="#"
        id="popup-closer"
        className="ol-popup-closer" />
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
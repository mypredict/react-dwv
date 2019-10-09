import React, { useEffect } from 'react';

import './DwvComponent.css';

const dwv = window.dwv;
dwv.gui.getElement = dwv.gui.base.getElement;
const dwvApp = new dwv.App();

function DwvComponent() {
  
  useEffect(() => {
    dwvApp.init({
      containerDivId: "dwv",
      tools: ['Livewire']
    });
    dwvApp.loadURLs([
      'http://localhost:3010/image/a.dcm',
      'http://localhost:3010/image/b.dcm',
      'http://localhost:3010/image/c.dcm'
    ]);
    dwvApp.addEventListener('load-end', () => {
      dwvApp.onChangeTool({
        currentTarget: { value: 'Livewire' }
      });
    });
    return () => dwvApp.removeEventListener('load-end');
  }, []);
  
  return (
    <div id="dwv">
      <div className="layerContainer">
        <canvas className="imageLayer"></canvas>
        <div className="drawDiv"></div>
      </div>
    </div>
  );
}

export default DwvComponent;

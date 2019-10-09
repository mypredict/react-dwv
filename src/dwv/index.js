import Livewire from './Livewire';
import ToolboxController from './ToolboxController';

const containerDivId = 'dwv';

const dwvApp = new DwvApp();
dwvApp.init();

let toolboxController = null;
let image = null;

function postLoadInit(data) {
  view = data.view;
  viewController = new dwv.ViewController(view);
  image = view.getImage();
  var size = image.getGeometry().getSize();
  dataWidth = size.getNumberOfColumns();
  dataHeight = size.getNumberOfRows();
  createLayers(dataWidth, dataHeight);
  // get the image data from the image layer
  imageData = imageLayer.getContext().createImageData(
    dataWidth, dataHeight);
  // image listeners
  view.addEventListener("wl-width-change", self.onWLChange);
  view.addEventListener("wl-center-change", self.onWLChange);
  view.addEventListener("colour-change", self.onColourChange);
  view.addEventListener("slice-change", self.onSliceChange);
  view.addEventListener("frame-change", self.onFrameChange);
  // connect with local listeners
  view.addEventListener("wl-width-change", fireEvent);
  view.addEventListener("wl-center-change", fireEvent);
  view.addEventListener("colour-change", fireEvent);
  view.addEventListener("position-change", fireEvent);
  view.addEventListener("slice-change", fireEvent);
  view.addEventListener("frame-change", fireEvent);
  // initialise the toolbox
  if ( toolboxController ) {
    toolboxController.initAndDisplay( imageLayer );
  }
  // init W/L display
  self.initWLDisplay();
}

function loadImageData(data, loader, options) {
  loader.onload = function (data) {
    postLoadInit(data);
  };
  loader.onloadend = function () {
    fireEvent({ 'type': 'load-end' });
  };
  loader.load(data, options);
}

function DwvApp() {
  this.init = () => {
    const livewire = new Livewire(this);
    toolboxController = new ToolboxController();
    toolboxController.create(toolList, this);
  }
  this.loadURLs = (imageIds) => {
    const urlIO = new dwv.io.UrlsLoader();
    loadImageData(imageIds, urlIO, {'requestHeaders': {}});
  }
  this.getDrawController = () => {
    return {
      getCurrentPosGroup: () => {
        return {
          add: (a) => {}
        };
      },
      getDrawLayer
    };
  }
}
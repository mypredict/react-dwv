import dwv from './dwv';

function ToolboxController() {
  let toolbox = null;

  this.create = (toolList, app) => {
    toolbox = new dwv.tool.Toolbox(toolList, app);
  }
}

export default ToolboxController;

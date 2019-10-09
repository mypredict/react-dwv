const dwv = {
  tool: {},
  html: {}
};

// Toolbox初始化
dwv.tool.Toolbox = function( toolList, app )
{
  /**
   * Toolbox GUI.
   * @type Object
   */
  var gui = null;
  /**
   * Selected tool.
   * @type Object
   */
  var selectedTool = null;
  /**
   * Default tool name.
   * @type String
   */
  var defaultToolName = null;

  /**
   * Get the list of tools.
   * @return {Array} The list of tool objects.
   */
  this.getToolList = function ()
  {
      return toolList;
  };

  /**
   * Get the selected tool.
   * @return {Object} The selected tool.
   */
  this.getSelectedTool = function ()
  {
      return selectedTool;
  };

  /**
   * Setup the toolbox GUI.
   */
  this.setup = function ()
  {
      if ( Object.keys(toolList).length !== 0 ) {
          gui = new dwv.gui.Toolbox(app);
          gui.setup(toolList);

          for( var key in toolList ) {
              toolList[key].setup();
          }
      }
  };

  /**
   * Display the toolbox.
   * @param {Boolean} bool Flag to display or not.
   */
  this.display = function (bool)
  {
      if ( Object.keys(toolList).length !== 0 && gui ) {
          gui.display(bool);
      }
  };

  /**
   * Initialise the tool box.
   */
  this.init = function ()
  {
      var keys = Object.keys(toolList);
      // check if we have tools
      if ( keys.length === 0 ) {
          return;
      }
      // init all tools
      defaultToolName = "";
      var displays = [];
      var display = null;
      for( var key in toolList ) {
          display = toolList[key].init();
          if ( display && defaultToolName === "" ) {
              defaultToolName = key;
          }
          displays.push(display);
      }
      this.setSelectedTool(defaultToolName);
      // init html
      if ( gui ) {
          gui.initialise(displays);
      }
  };

  /**
   * Set the selected tool.
   * @return {String} The name of the tool to select.
   */
  this.setSelectedTool = function (name)
  {
      // check if we have it
      if( !this.hasTool(name) )
      {
          throw new Error("Unknown tool: '" + name + "'");
      }
      // hide last selected
      if( selectedTool )
      {
          selectedTool.display(false);
      }
      // enable new one
      selectedTool = toolList[name];
      // display it
      selectedTool.display(true);
  };

  /**
   * Reset the tool box.
   */
  this.reset = function ()
  {
      // hide last selected
      if ( selectedTool ) {
          selectedTool.display(false);
      }
      selectedTool = null;
      defaultToolName = null;
  };
};

// 样式
dwv.html.Style = function ()
{
  /**
   * Font size.
   * @private
   * @type Number
   */
  var fontSize = 12;
  /**
   * Font family.
   * @private
   * @type String
   */
  var fontFamily = "Verdana";
  /**
   * Text colour.
   * @private
   * @type String
   */
  var textColour = "#fff";
  /**
   * Line colour.
   * @private
   * @type String
   */
  var lineColour = "#ffff80";
  /**
   * Display scale.
   * @private
   * @type Number
   */
  var displayScale = 1;
  /**
   * Stroke width.
   * @private
   * @type Number
   */
  var strokeWidth = 2;

  /**
   * Get the font family.
   * @return {String} The font family.
   */
  this.getFontFamily = function () { return fontFamily; };

  /**
   * Get the font size.
   * @return {Number} The font size.
   */
  this.getFontSize = function () { return fontSize; };

  /**
   * Get the stroke width.
   * @return {Number} The stroke width.
   */
  this.getStrokeWidth = function () { return strokeWidth; };

  /**
   * Get the text colour.
   * @return {String} The text colour.
   */
  this.getTextColour = function () { return textColour; };

  /**
   * Get the line colour.
   * @return {String} The line colour.
   */
  this.getLineColour = function () { return lineColour; };

  /**
   * Set the line colour.
   * @param {String} colour The line colour.
   */
  this.setLineColour = function (colour) { lineColour = colour; };

  /**
   * Set the display scale.
   * @param {String} scale The display scale.
   */
  this.setScale = function (scale) { displayScale = scale; };

  /**
   * Scale an input value.
   * @param {Number} value The value to scale.
   */
  this.scale = function (value) { return value / displayScale; };
};

/**
* Get the font definition string.
* @return {String} The font definition string.
*/
dwv.html.Style.prototype.getFontStr = function ()
{
  return ("normal " + this.getFontSize() + "px sans-serif");
};

/**
* Get the line height.
* @return {Number} The line height.
*/
dwv.html.Style.prototype.getLineHeight = function ()
{
  return ( this.getFontSize() + this.getFontSize() / 5 );
};

/**
* Get the font size scaled to the display.
* @return {Number} The scaled font size.
*/
dwv.html.Style.prototype.getScaledFontSize = function ()
{
  return this.scale( this.getFontSize() );
};

/**
* Get the stroke width scaled to the display.
* @return {Number} The scaled stroke width.
*/
dwv.html.Style.prototype.getScaledStrokeWidth = function ()
{
  return this.scale( this.getStrokeWidth() );
};

export default dwv;

dwv.math.Path = function(inputPointArray, inputControlPointIndexArray)
{
    if (inputPointArray) {
        alert(1)
    }
  /**
   * List of points.
   * @type Array
   */
  this.pointArray = inputPointArray ? inputPointArray.slice() : [];
  /**
   * List of control points.
   * @type Array
   */
  this.controlPointIndexArray = inputControlPointIndexArray ?
      inputControlPointIndexArray.slice() : [];
}; // Path class

dwv.math.Path.prototype.getPoint = function(index) {
  // alert(index)
return this.pointArray[index];
};

/**
* Is the given point a control point.
* @param {Object} point The Point2D to check.
* @return {Boolean} True if a control point.
*/
dwv.math.Path.prototype.isControlPoint = function(point) {
var index = this.pointArray.indexOf(point);
if( index !== -1 ) {
    return this.controlPointIndexArray.indexOf(index) !== -1;
}
else {
    throw new Error("Error: isControlPoint called with not in list point.");
}
};

/**
* Get the length of the path.
* @return {Number} The length of the path.
*/
dwv.math.Path.prototype.getLength = function() {
return this.pointArray.length;
};

/**
* Add a point to the path.
* @param {Object} point The Point2D to add.
*/
dwv.math.Path.prototype.addPoint = function(point) {
this.pointArray.push(point);
};

/**
* Add a control point to the path.
* @param {Object} point The Point2D to make a control point.
*/
dwv.math.Path.prototype.addControlPoint = function(point) {
var index = this.pointArray.indexOf(point);
if( index !== -1 ) {
    this.controlPointIndexArray.push(index);
}
else {
    throw new Error("Error: addControlPoint called with no point in list point.");
}
};

/**
* Add points to the path.
* @param {Array} points The list of Point2D to add.
*/
dwv.math.Path.prototype.addPoints = function(newPointArray) {
this.pointArray = this.pointArray.concat(newPointArray);
};

/**
* Append a Path to this one.
* @param {Path} other The Path to append.
*/
dwv.math.Path.prototype.appenPath = function(other) {
var oldSize = this.pointArray.length;
this.pointArray = this.pointArray.concat(other.pointArray);
var indexArray = [];
for( var i=0; i < other.controlPointIndexArray.length; ++i ) {
    indexArray[i] = other.controlPointIndexArray[i] + oldSize;
}
this.controlPointIndexArray = this.controlPointIndexArray.concat(indexArray);
};
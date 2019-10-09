dwv.math.Scissors = function()
{
  this.width = -1;
  this.height = -1;

  this.curPoint = null; // Corrent point we're searching on.
  this.searchGranBits = 8; // Bits of resolution for BucketQueue.
  this.searchGran = 1 << this.earchGranBits; //bits.
  this.pointsPerPost = 500;

  // Precomputed image data. All in ranges 0 >= x >= 1 and all inverted (1 - x).
  this.greyscale = null; // Greyscale of image
  this.laplace = null; // Laplace zero-crossings (either 0 or 1).
  this.gradient = null; // Gradient magnitudes.
  this.gradX = null; // X-differences.
  this.gradY = null; // Y-differences.

  this.parents = null; // Matrix mapping point => parent along shortest-path to root.

  this.working = false; // Currently computing shortest paths?

  // Begin Training:
  this.trained = false;
  this.trainingPoints = null;

  this.edgeWidth = 2;
  this.trainingLength = 32;

  this.edgeGran = 256;
  this.edgeTraining = null;

  this.gradPointsNeeded = 32;
  this.gradGran = 1024;
  this.gradTraining = null;

  this.insideGran = 256;
  this.insideTraining = null;

  this.outsideGran = 256;
  this.outsideTraining = null;
  // End Training
}; // Scissors class

// Begin training methods //
dwv.math.Scissors.prototype.getTrainingIdx = function(granularity, value) {
  return Math.round((granularity - 1) * value);
};

dwv.math.Scissors.prototype.getTrainedEdge = function(edge) {
  return this.edgeTraining[this.getTrainingIdx(this.edgeGran, edge)];
};

dwv.math.Scissors.prototype.getTrainedGrad = function(grad) {
  return this.gradTraining[this.getTrainingIdx(this.gradGran, grad)];
};

dwv.math.Scissors.prototype.getTrainedInside = function(inside) {
  return this.insideTraining[this.getTrainingIdx(this.insideGran, inside)];
};

dwv.math.Scissors.prototype.getTrainedOutside = function(outside) {
  return this.outsideTraining[this.getTrainingIdx(this.outsideGran, outside)];
};
// End training methods //

dwv.math.Scissors.prototype.setWorking = function(working) {
  // Sets working flag
  this.working = working;
};

dwv.math.Scissors.prototype.setDimensions = function(width, height) {
  this.width = width;
  this.height = height;
};

dwv.math.Scissors.prototype.setData = function(data) {
  if ( this.width === -1 || this.height === -1 ) {
      // The width and height should have already been set
      throw new Error("Dimensions have not been set.");
  }

  this.greyscale = dwv.math.computeGreyscale(data, this.width, this.height);
  this.laplace = dwv.math.computeLaplace(this.greyscale);
  this.gradient = dwv.math.computeGradient(this.greyscale);
  this.gradX = dwv.math.computeGradX(this.greyscale);
  this.gradY = dwv.math.computeGradY(this.greyscale);

  var sides = dwv.math.computeSides(this.edgeWidth, this.gradX, this.gradY, this.greyscale);
  this.inside = sides.inside;
  this.outside = sides.outside;
  this.edgeTraining = [];
  this.gradTraining = [];
  this.insideTraining = [];
  this.outsideTraining = [];
};

dwv.math.Scissors.prototype.findTrainingPoints = function(p) {
  // Grab the last handful of points for training
  var points = [];

  if ( this.parents !== null ) {
      for ( var i = 0; i < this.trainingLength && p; i++ ) {
          points.push(p);
          p = this.parents[p.y][p.x];
      }
  }

  return points;
};

dwv.math.Scissors.prototype.resetTraining = function() {
  this.trained = false; // Training is ignored with this flag set
};

dwv.math.Scissors.prototype.doTraining = function(p) {
  // Compute training weights and measures
  this.trainingPoints = this.findTrainingPoints(p);

  if ( this.trainingPoints.length < 8 ) {
      return; // Not enough points, I think. It might crash if length = 0.
  }

  var buffer = [];
  this.calculateTraining(buffer, this.edgeGran, this.greyscale, this.edgeTraining);
  this.calculateTraining(buffer, this.gradGran, this.gradient, this.gradTraining);
  this.calculateTraining(buffer, this.insideGran, this.inside, this.insideTraining);
  this.calculateTraining(buffer, this.outsideGran, this.outside, this.outsideTraining);

  if ( this.trainingPoints.length < this.gradPointsNeeded ) {
      // If we have two few training points, the gradient weight map might not
      // be smooth enough, so average with normal weights.
      this.addInStaticGrad(this.trainingPoints.length, this.gradPointsNeeded);
  }

  this.trained = true;
};

dwv.math.Scissors.prototype.calculateTraining = function(buffer, granularity, input, output) {
  var i = 0;
  // Build a map of raw-weights to trained-weights by favoring input values
  buffer.length = granularity;
  for ( i = 0; i < granularity; i++ ) {
      buffer[i] = 0;
  }

  var maxVal = 1;
  for ( i = 0; i < this.trainingPoints.length; i++ ) {
      var p = this.trainingPoints[i];
      var idx = this.getTrainingIdx(granularity, input[p.y][p.x]);
      buffer[idx] += 1;

      maxVal = Math.max(maxVal, buffer[idx]);
  }

  // Invert and scale.
  for ( i = 0; i < granularity; i++ ) {
      buffer[i] = 1 - buffer[i] / maxVal;
  }

  // Blur it, as suggested. Gets rid of static.
  dwv.math.gaussianBlur(buffer, output);
};

dwv.math.Scissors.prototype.addInStaticGrad = function(have, need) {
  // Average gradient raw-weights to trained-weights map with standard weight
  // map so that we don't end up with something to spiky
  for ( var i = 0; i < this.gradGran; i++ ) {
      this.gradTraining[i] = Math.min(this.gradTraining[i],  1 - i*(need - have)/(need*this.gradGran));
  }
};

dwv.math.Scissors.prototype.gradDirection = function(px, py, qx, qy) {
  return dwv.math.gradDirection(this.gradX, this.gradY, px, py, qx, qy);
};

dwv.math.Scissors.prototype.dist = function(px, py, qx, qy) {
  // The grand culmunation of most of the code: the weighted distance function
  var grad =  this.gradient[qy][qx];

  if ( px === qx || py === qy ) {
      // The distance is Euclidean-ish; non-diagonal edges should be shorter
      grad *= Math.SQRT1_2;
  }

  var lap = this.laplace[qy][qx];
  var dir = this.gradDirection(px, py, qx, qy);

  if ( this.trained ) {
      // Apply training magic
      var gradT = this.getTrainedGrad(grad);
      var edgeT = this.getTrainedEdge(this.greyscale[py][px]);
      var insideT = this.getTrainedInside(this.inside[py][px]);
      var outsideT = this.getTrainedOutside(this.outside[py][px]);

      return 0.3*gradT + 0.3*lap + 0.1*(dir + edgeT + insideT + outsideT);
  } else {
      // Normal weights
      return 0.43*grad + 0.43*lap + 0.11*dir;
  }
};

dwv.math.Scissors.prototype.adj = function(p) {
  var list = [];

  var sx = Math.max(p.x-1, 0);
  var sy = Math.max(p.y-1, 0);
  var ex = Math.min(p.x+1, this.greyscale[0].length-1);
  var ey = Math.min(p.y+1, this.greyscale.length-1);

  var idx = 0;
  for ( var y = sy; y <= ey; y++ ) {
      for ( var x = sx; x <= ex; x++ ) {
          if ( x !== p.x || y !== p.y ) {
              list[idx++] = new dwv.math.FastPoint2D(x,y);
          }
      }
  }

  return list;
};

dwv.math.Scissors.prototype.setPoint = function(sp) {
  this.setWorking(true);

  this.curPoint = sp;

  var x = 0;
  var y = 0;

  this.visited = [];
  for ( y = 0; y < this.height; y++ ) {
      this.visited[y] = [];
      for ( x = 0; x < this.width; x++ ) {
          this.visited[y][x] = false;
      }
  }

  this.parents = [];
  for ( y = 0; y < this.height; y++ ) {
      this.parents[y] = [];
  }

  this.cost = [];
  for ( y = 0; y < this.height; y++ ) {
      this.cost[y] = [];
      for ( x = 0; x < this.width; x++ ) {
          this.cost[y][x] = Number.MAX_VALUE;
      }
  }

  this.pq = new dwv.math.BucketQueue(this.searchGranBits, function(p) {
      return Math.round(this.searchGran * this.costArr[p.y][p.x]);
  });
  this.pq.searchGran = this.searchGran;
  this.pq.costArr = this.cost;

  this.pq.push(sp);
  this.cost[sp.y][sp.x] = 0;
};

dwv.math.Scissors.prototype.doWork = function() {
  if ( !this.working ) {
      return;
  }

  this.timeout = null;

  var pointCount = 0;
  var newPoints = [];
  while ( !this.pq.isEmpty() && pointCount < this.pointsPerPost ) {
      var p = this.pq.pop();
      newPoints.push(p);
      newPoints.push(this.parents[p.y][p.x]);

      this.visited[p.y][p.x] = true;

      var adjList = this.adj(p);
      for ( var i = 0; i < adjList.length; i++) {
          var q = adjList[i];

          var pqCost = this.cost[p.y][p.x] + this.dist(p.x, p.y, q.x, q.y);

          if ( pqCost < this.cost[q.y][q.x] ) {
              if ( this.cost[q.y][q.x] !== Number.MAX_VALUE ) {
                  // Already in PQ, must remove it so we can re-add it.
                  this.pq.remove(q);
              }

              this.cost[q.y][q.x] = pqCost;
              this.parents[q.y][q.x] = p;
              this.pq.push(q);
          }
      }

      pointCount++;
  }

  return newPoints;
};
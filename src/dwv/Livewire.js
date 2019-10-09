function Point2D(x, y) {
  this.getX = () => x;
  this.getY = () => y;
};

function Livewire(app) {
  let shapeGroup = null;
  const parentPoints = [];
  // 起点的坐标
  this.x0 = 0;
  this.y0 = 0;
  this.started = false;

  function clearParentPoints() {
    const nrows = app.getImage().getGeometry().getSize().getNumberOfRows();
    for( var i = 0; i < nrows; ++i ) {
      parentPoints[i] = [];
    }
  }

  /*
    {
      this.controlPointIndexArray = [],
      this.pointArray = [],
      this.controlPointIndexArray = [],
      this.addPoint = (point) => {
        this.pointArray.push(point);
      },
      this.getPoint = (index) => {
        return this.pointArray[index]
      },
      this.addControlPoint = (point) => {
        this.controlPointIndexArray.push(this.pointArray.indexOf(point));
      }
    }
  */
  const path = dwv.math.Path();
  const currentPath = dwv.math.Path();

  const scissors = new dwv.math.Scissors();

  this.handleMousedown = (event) => {
    if (this.started) {
      path = currentPath;
      clearParentPoints();
      // var pn = new dwv.math.FastPoint2D(event._x, event._y);
      // scissors.doTraining(pn);
      path.addControlPoint(currentPath.getPoint(0));
    } else {
      this.started = true;
      this.x0 = event._x;
      this.y0 = event._y;
      // 将第一个点(一个实例化对象)添加到 path 和 currentPath
      const p0 = new Point2D(event._x, event._y);
      path.addPoint(p0);
      path.addControlPoint(p0);
    }
  }

  this.handleMouseMove = (event) => {
    if (this.started) {
      const pn = new dwv.math.FastPoint2D(event._x, event._y);
      scissors.setPoint(pn);
      let result = 0;
      let stop = false;

      while (!parentPoints[pn.y][pn.x] && !stop) {
        result = scissors.doWork();
        if (result.length === 0) {
          stop = true;
        } else {
          for (let i=0; i<result.length-1; i+=2) {
            const _p = result[i];
            const _q = result[i+1];
            parentPoints[_p.y][_p.x] = _q;
          }
        }
      }

      currentPath = new dwv.math.Path();
      stop = false;
      if (shapeGroup) {
        shapeGroup.destroy();
      }

      const factory = new dwv.tool.RoiFactory();
      const style = new dwv.html.Style();
      shapeGroup = factory.create(currentPath.pointArray, style);
      const posGroup = app.getDrawController().getCurrentPosGroup();
      posGroup.add(shapeGroup);
      app.getDrawController().getDrawLayer().draw();
    }
  }

  this.handleDbclick = () => {
    this.started = false;
  }
}

export default Livewire;

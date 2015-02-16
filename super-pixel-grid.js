var SuperPixelGrid = function (w, h , initArray) {
    if (!(this instanceof SuperPixelGrid)) {
        return new SuperPixelGrid(w, h, initArray);
    }
    Array2d.call(this, w, h, initArray);
};
SuperPixelGrid.prototype = new Array2d();
SuperPixelGrid.prototype.constructor = SuperPixelGrid;

SuperPixelGrid.prototype.togglePixel = function(x, y) {
      this.set(x, y, !this.get(x, y));    
};

SuperPixelGrid.prototype.drawLine = function(x0, y0, x1, y1, color) {
    var self = this;
    self.forLine(x0, y0, x1, y1, function(val, x, y) {self.set(x, y, color);});
    return this;
};

SuperPixelGrid.prototype.drawRectangle = function(x0, y0, x1, y1, color) {
    this.drawLine(x0, y0, x1, y0, color);
    this.drawLine(x1, y0, x1, y1, color);
    this.drawLine(x1, y1, x0, y1, color);
    this.drawLine(x0, y1, x0, y0, color);
    return this;
};

SuperPixelGrid.prototype.drawCircle = function(x0, y0, x1, y1, color) {
    
};

SuperPixelGrid.prototype.floodFill = function(x, y, color) {
  // if pixel is already toggled, stop
  if (this.get(x, y) != color) {
    this.set(x, y, color);
    // fill up
    if (y > 0) {
      this.floodFill(x, y - 1, color);
    }
    // fill down
    if (y < this.height - 1) {
      this.floodFill(x, y + 1, color);          
    }
    // fill left
    if (x > 0) {
      this.floodFill(x - 1, y, color);
    }
    // fill right
    if (x < this.width - 1) {
      this.floodFill(x + 1, y, color);          
    }
  }
  return this;
};

SuperPixelGrid.prototype.lifeStep = function() {
    var self = this;
    var newFrame = self.map( function(value, x, y, w, h) {
      var neighbors = [];
      if (x > 0) {
        if (y > 0) { neighbors.push(self.get(x - 1, y - 1)); }
        neighbors.push(self.get(x - 1, y));
        if (y < self.height - 1) { neighbors.push(self.get(x - 1, y + 1)); }
      }
      if (y > 0) { neighbors.push(self.get(x, y - 1)); }
      if (y < self.height - 1) { neighbors.push(self.get(x, y + 1)); }
      if (x < self.width - 1) {
        if (y > 0) { neighbors.push(self.get(x + 1, y - 1)); }
        neighbors.push(self.get(x + 1, y));
        if (y < self.height + 1) { neighbors.push(self.get(x + 1, y + 1)); }
      }
      var liveNeighbors = neighbors
        .map( function(isTrue) {return isTrue ? 1 : 0;} ) //map bool to int
        .reduce( function(a,b) {return a + b;} ); //sum
      if (value === true) { // this cell is 'alive'
        if (liveNeighbors < 2 || liveNeighbors > 3) {
          return false;
        }
        else {
          return true;
        }
      } else { //this cell is 'dead'
        if (liveNeighbors === 3) {
          return true;
        } else {
          return false;
        }
      }
    });
    this.rawArray = newFrame.rawArray.slice();
    return this;
};

SuperPixelGrid.prototype.toString = function() {
    return this.rawArray.map( function(n){return n ? 1 : 0;} ).join('');
};

SuperPixelGrid.prototype.fromString = function(s) {
    var rawArray = s.split("").map( function(n) {return n == 1;} );
    this.rawArray = rawArray.slice();
    return this;
};


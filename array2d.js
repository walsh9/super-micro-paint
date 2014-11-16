var Array2d = function (w, h, initArray) {
    if (!(this instanceof Array2d)) {
        return new Array2d(w, h, initArray);
    }
    var rawArray = [];
    var i;
    if (initArray && initArray.length === w * h) {
        rawArray = initArray.slice(0);
    } else {
        for (i = 0; i < w * h; i++) {
            rawArray[i] = undefined;
        }
    }
    this.width = w;
    this.height = h;
    this.rawArray = rawArray;
};
Array2d.prototype.get = function (x, y) {
    return this.rawArray[x + y * this.width];
};
Array2d.prototype.set = function (x, y, val) {
    console.log(x, y, val, x + y * this.width);
    this.rawArray[x + y * this.width] = val;
    return this;
};

Array2d.prototype.forEach = function (callback, thisArg) {
    var i, x, y;
    var len = this.rawArray.length;
    for (i = 0; i < len; i++) {
        x = i % this.width;
        y = Math.floor(i / this.width);
        callback.call(thisArg, this.rawArray[i], x, y, this.width, this.height);
    }
    return undefined;
};
Array2d.prototype.map = function (callback, thisArg) {
    var mappedArray = this.clone();
    this.forEach(function (value, x, y, w, h) {
        var newValue = callback.call(thisArg, value, x, y, w, h);
        mappedArray.set(x, y, newValue);
    });
    return mappedArray;
};
Array2d.prototype.slice2d = function(x1, y1, x2, y2) {
    var arraySlice = [];
    var x, y;
    x2 = x2 || this.width;
    y2 = y2 || this.height;
    for (y = y1; y < y2; y++) {
        for (x = x1; x < x2; x++) {
            arraySlice.push(this.get(x, y));
        }
    }
    return new Array2d(x2 - x1, y2 - y1, arraySlice);
};
Array2d.prototype.clone = function() {
    return this.slice2d(0,0);
};
Array2d.prototype.fill = function(value) {
    var w = this.width;
    var h = this.height;
      for (i = 0; i < w * h; i++) {
        this.rawArray[i] = value;
    }
    return this;
};
Array2d.prototype.toString = function() {
    var x, y;
    var w = this.width;
    var h = this.height;
    var s = "[ \n";
    for (y = 0; y < h; y++) {
        s = s + "  [" +
            this.rawArray.slice(y * w,y * w + w).join(",") + 
            "]\n";
    }
    s = s + "]";
    return s;
};


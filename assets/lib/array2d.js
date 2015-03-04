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
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
        throw new RangeError('Index out of bounds');
    } else {
        this.rawArray[x + y * this.width] = val;
        return this;
    }
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
Array2d.prototype.slice2d = function (x0, y0, x1, y1) {
    var arraySlice = [];
    var x, y;
    x1 = x1 || this.width;
    y1 = y1 || this.height;
    for (y = y0; y < y1; y++) {
        for (x = x0; x < x1; x++) {
            arraySlice.push(this.get(x, y));
        }
    }
    return new Array2d(x1 - x0, y1 - y0, arraySlice);
};
Array2d.prototype.clone = function () {
    return this.slice2d(0, 0);
};
Array2d.prototype.do = function (x, y, callback, thisArg) {
    callback.call(thisArg, this.rawArray[x + y * this.width], x, y, this.width, this.height);
    return this;
};
Array2d.prototype.forLine = function (x0, y0, x1, y1, callback, thisArg) {
    var deltaX = Math.abs(x1 - x0);
    var deltaY = -Math.abs(y1 - y0);
    var signX = x0 < x1 ? 1 : -1;
    var signY = y0 < y1 ? 1 : -1;
    var err = deltaX + deltaY;
    var e2;
    this.do(x0, y0, callback, thisArg);
    while (!(x0 == x1 && y0 == y1)) {
        e2 = Math.floor(err * 2);
        if (e2 >= deltaY) {
            err += deltaY;
            x0 += signX;
        }
        if (e2 <= deltaX) {
            err += deltaX;
            y0 += signY;
        }
        this.do(x0, y0, callback, thisArg);
    }
};
Array2d.prototype.fill = function (value) {
    var w = this.width;
    var h = this.height;
    for (i = 0; i < w * h; i++) {
        this.rawArray[i] = value;
    }
    return this;
};
Array2d.prototype.toString = function () {
    var x, y;
    var w = this.width;
    var h = this.height;
    var s = "[ \n";
    for (y = 0; y < h; y++) {
        s = s + "  [" + this.rawArray.slice(y * w, y * w + w)
            .join(",") + "]\n";
    }
    s = s + "]";
    return s;
};
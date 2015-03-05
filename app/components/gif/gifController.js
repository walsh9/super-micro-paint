angular.module('super-micro-paint', ['touch-directives'])
    .controller('gifController', ['$scope', function ($scope) {

        var getParameterByName = function (name) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
            return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        };

        $scope.renderMode = 'LCD';
        $scope.delay = 400;
        $scope.scale = 15;
        $scope.color = 0;
        var h = 16;
        var w = 32;

        $scope.renderModes = {};
        $scope.renderModes.LCD = {};
        $scope.renderModes.VFD = {};
        $scope.renderModes.LED = {};

        $scope.renderModes.LCD.minSize = 1;
        $scope.renderModes.VFD.minSize = 4;
        $scope.renderModes.LED.minSize = 8;

        $scope.modeChanged = function() {
            if ($scope.scale < $scope.renderModes[$scope.renderMode].minSize) {
                $scope.scale = $scope.renderModes[$scope.renderMode].minSize;
            }  
            drawGif();
        };

        $scope.scales = [];
        for (i = 1; i <= 16; i++) {
            var s = {
                label: i + "x (" + w * i + " x " + h * i + ")",
                scale: i,
            };
            $scope.scales.push(s);
        }
        $scope.validScale = function(s) {
            return s.scale >= $scope.renderModes[$scope.renderMode].minSize;
        };
        $scope.scaleChanged = function() {
            drawGif();
        };

        $scope.speeds = [
            {label:'Slow', delay:800, minSize: 8},  
            {label:'Normal', delay:400, minSize: 1},  
            {label:'Fast', delay:100, minSize: 4}, 
        ];
        $scope.speedChanged = function() {
            drawGif();
        };

        var numFrames = 4;
        var drawing = [];
        var base64Drawing = getParameterByName('smp');

        $scope.renderModes.LCD.draw = {};
        $scope.renderModes.LCD.draw.bg = function (w, h, ctx) {
            ctx.save();
            ctx.fillStyle = '#DCF0E6';
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        };
        $scope.renderModes.LCD.draw.on = function (x, y, pixelW, pixelH, ctx) {
            ctx.save();
            var small = pixelW <= 6;
            var shadowSize = small ? 0 : 1;
            ctx.strokeStyle = 'rgba(40, 40, 40, 0.85)';
            ctx.fillStyle = 'rgba(40, 40, 40, 0.85)';
            ctx.shadowOffsetX = shadowSize;
            ctx.shadowOffsetY = shadowSize;
            ctx.shadowBlur =  shadowSize * 2;
            ctx.shadowColor = '#888';
            ctx.fillRect(x + shadowSize, y + shadowSize, pixelW - shadowSize * 2, pixelH - shadowSize * 2);
            ctx.restore();
        };
        $scope.renderModes.LCD.draw.off = function (x, y, pixelW, pixelH, ctx) {
            ctx.save();
            var small = pixelW <= 6;
            var gapSize = small ? 0 : 1;
            ctx.strokeStyle = 'rgba(40, 40, 40, 0.05)';
            ctx.fillStyle = 'rgba(40, 40, 40, 0.05)';
            ctx.fillRect(x + gapSize, y + gapSize, pixelW - gapSize * 2, pixelH - gapSize * 2);              
            ctx.restore();
        };

        $scope.renderModes.VFD.draw = {};
        $scope.renderModes.VFD.draw.bg = function (w, h, ctx) {
            ctx.save();
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        };
        $scope.renderModes.VFD.draw.on = function (x, y, pixelW, pixelH, ctx) {
            ctx.save();
            ctx.fillStyle = 'rgba(128, 240, 240, 1)';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 5;
            ctx.shadowColor = 'rgba(128, 240, 240, 1)';
            ctx.fillRect(x + 1, y + 1, pixelW - 2, pixelH - 2);
            ctx.restore();
        };
        $scope.renderModes.VFD.draw.off = function (x, y, pixelW, pixelH, ctx) {
            ctx.save();
            ctx.fillStyle = 'rgba(10, 10, 10, 1)';
            ctx.fillRect(x + 1, y + 1, pixelW - 2, pixelH - 2);
            ctx.restore();        
        };

        $scope.renderModes.LED.draw = {};
        $scope.renderModes.LED.draw.bg = function (w, h, ctx) {
            ctx.save();
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        };
        $scope.renderModes.LED.draw.on = function (x, y, pixelW, pixelH, ctx) {
            ctx.save();
            var center = {};
            center.x = x + pixelW / 2;
            center.y = y + pixelH / 2;
            ctx.fillStyle = 'rgba(230, 120, 120, 1)';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 5;
            ctx.shadowColor = 'rgba(240, 100, 100, 1)';
            ctx.beginPath();
            ctx.arc(center.x, center.y, pixelW / 2 - 2, 0, Math.PI*2); 
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(240, 220, 220, 0.5)';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 0.5;
            ctx.shadowColor = 'rgba(240, 220, 220, 1)';
            ctx.beginPath();
            ctx.arc(center.x, center.y - 1, pixelW / 8, 0, Math.PI*2); 
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        };
        $scope.renderModes.LED.draw.off = function (x, y, pixelW, pixelH, ctx) {
            ctx.save();
            var center = {};
            center.x = x + pixelW / 2;
            center.y = y + pixelH / 2;
            ctx.fillStyle = 'rgba(15, 15, 15, 1)';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 1;
            ctx.shadowColor = 'rgba(240, 240, 240, .6)';
            ctx.beginPath();
            ctx.arc(center.x, center.y, pixelW / 2 - 2, 0, Math.PI*2); 
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(240, 220, 220, 0.5)';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 0.5;
            ctx.shadowColor = 'rgba(240, 220, 220, 1)';
            ctx.beginPath();
            ctx.arc(center.x, center.y - 1, pixelW / 16, 0, Math.PI*2); 
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        };
        for (var i = 0; i < numFrames; i++) {
            drawing[i] = new SuperPixelGrid(w,h);
            drawing[i].fromUrlSafeBase64(base64Drawing.slice(i * 86));
        }
        var drawGif = function() {
            var container = $('#output');
            container.addClass('loading');
            var gif = new GIF({
              workers: 4,
              quality: 1,
              workerScript: '../assets/lib/gif.worker.js',
            });
            drawing.forEach(function (frame){
                var delay = $scope.delay;
                var draw = $scope.renderModes[$scope.renderMode].draw;
                var pixelScale = $scope.scale;    
                var canvas = document.createElement('canvas');
                canvas.width = w * pixelScale;
                canvas.height = h * pixelScale;
                var ctx = canvas.getContext('2d');
                frame.drawToCanvas(canvas.width, canvas.height, pixelScale, pixelScale, canvas, draw.bg, draw.off, draw.on);
                gif.addFrame(canvas, {delay: delay});
            });
            gif.on('finished', function(blob) {
                var img = $('<img>');
                img.attr('src', URL.createObjectURL(blob));
                container.empty();
                container.removeClass('loading');
                container.append(img);
            });
            gif.render();
        };
        drawGif();
}]);
angular.module('upload',[])
    .factory('gfycat', function () {
    var service = {};
    var _randomKey = function () {
        var key = "";
        for (var i = 10; i > 0; i--) {
            key = key + Math.floor(Math.random() * 36).toString(36);
        }
        return key;
    };
    var parseResponse = function(jsonResponse) {
        return new Promise(function (resolve, reject) {
            try {
                var response = JSON.parse(jsonResponse);
                console.log(response);             
                resolve(response);
            }
            catch(e) {
                reject(Error('Error parsing response: ' + e));
            }
        });
    };
    var transcode = function (key) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            var transcodeUrl = "https://upload.gfycat.com/transcode/" + key;
            xhr.open('GET', transcodeUrl, true );
            xhr.onload = function(response) {
                if (this.status == 200) {
                    resolve(this.response);
                } else {
                    reject(Error('Connection Error: ' + e.error));
                }
                xhr.onerror = function (e) {
                    reject(Error('Error connecting to gfycat: ' + e.error));
                };
            };
            console.log('Fetching gif URL...');
            xhr.send();
        });
    };
    var upload = function (imageBlob, key) {
        return new Promise(function (resolve, reject) {
            var fd = new FormData();
            var xhr = new XMLHttpRequest();
            var postUrl = 'https://gifaffe.s3.amazonaws.com/';
            fd.append('key', key);
            fd.append('acl', 'private');
            fd.append('AWSAccessKeyId','AKIAIT4VU4B7G2LQYKZQ');
            fd.append('success_action_status', '200');
            fd.append('policy', 'eyAiZXhwaXJhdGlvbiI6ICIyMDIwLTEyLTAxVDEyOjAwOjAwLjAwMFoiLAogICAgICAgICAgICAiY29uZGl0aW9ucyI6IFsKICAgICAgICAgICAgeyJidWNrZXQiOiAiZ2lmYWZmZSJ9LAogICAgICAgICAgICBbInN0YXJ0cy13aXRoIiwgIiRrZXkiLCAiIl0sCiAgICAgICAgICAgIHsiYWNsIjogInByaXZhdGUifSwKCSAgICB7InN1Y2Nlc3NfYWN0aW9uX3N0YXR1cyI6ICIyMDAifSwKICAgICAgICAgICAgWyJzdGFydHMtd2l0aCIsICIkQ29udGVudC1UeXBlIiwgIiJdLAogICAgICAgICAgICBbImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwgMCwgNTI0Mjg4MDAwXQogICAgICAgICAgICBdCiAgICAgICAgICB9');
            fd.append('signature', 'mk9t/U/wRN4/uU01mXfeTe2Kcoc=');
            fd.append('Content-Type', 'image/gif');
            fd.append('file', imageBlob);
            xhr.open( 'POST', postUrl, true );
            xhr.onload = function(e) {
                if (this.status == 200) {
                    console.log('Upload complete.');
                    resolve(key);
                } else {
                    reject(Error('Connection Error: ' + e.error));
                }
            };
            xhr.onerror = function (e) {
                reject(Error('Error uploading to gfycat: ' + e.error));
            };
            console.log('Uploading image ' + key + '...');
            xhr.send(fd);
        });
    };
    service.upload = function(imageBlob) {
        var key = _randomKey();
        return upload(imageBlob, key).then(transcode).then(parseResponse);
    };
    return service;
}).factory('imgur', function () {
    var service = {};
    var CLIENT_ID = '81cc7fc58deb0ef';
    var parseResponse = function(jsonResponse) {
        return new Promise(function (resolve, reject) {
            try {
                var response = JSON.parse(jsonResponse);
                console.log(response);             
                resolve(response.data);
            }
            catch(e) {
                reject(Error('Error parsing response: ' + e));
            }
        });
    };
    var upload = function (imageBlob, title) {
        return new Promise(function (resolve, reject) {
            var fd = new FormData();
            var xhr = new XMLHttpRequest();
            var postUrl = 'https://api.imgur.com/3/image';
            fd.append('image', imageBlob);
            fd.append('type', 'file');
            fd.append('title', title || '');
            fd.append('description', 'Made with Super Micro Paint. https://walsh9.github.io/super-micro-paint');
            xhr.open( 'POST', postUrl, true );
            xhr.setRequestHeader('Authorization', 'Client-ID ' + CLIENT_ID);
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.onload = function(e) {
                if (this.status == 200) {
                    console.log('Upload complete.');
                    resolve(this.response);
                } else {
                    reject(Error('Connection Error: ' + e.error));
                }
            };
            xhr.onerror = function (e) {
                reject(Error('Error uploading to imgur: ' + e.error));
            };
            console.log('Uploading image...');
            xhr.send(fd);
        });
    };
    service.upload = function(imageBlob, title) {
        return upload(imageBlob, title).then(parseResponse);
    };
    return service;
});


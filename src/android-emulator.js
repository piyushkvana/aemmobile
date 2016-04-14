/**
    Copyright (c) 2016 Adobe Systems Incorporated. All rights reserved.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
 */
"use strict";

var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var Q = require('q');
var spinner = require('simple-spinner');

module.exports = {
    start: function(name) {
        var defer = Q.defer();
        var userHome = process.env.HOME;

        function checkBooted(port) {
            if (defer.promise.isRejected()) {
                return;
            }

            var checkCmd = null;
            if (process.platform == 'win32') {
                checkCmd = path.join(userHome, 'platforms/android/sdk/platform-tools/adb') + ' shell pm path android | findstr package:/system/framework/framework-res.apk';
            } else if (process.platform == 'darwin') {
                checkCmd = path.join(userHome, 'platforms/android/sdk/platform-tools/adb') + ' shell pm path android | grep package:/system/framework/framework-res.apk';
            } else {
                deferred.reject(new Error("Plaform not supported: ", process.platform));
                return;
            }

            shell.exec(checkCmd, {
                silent: true
            }, function(code, output) {
                if (code !== 0) {
                    setTimeout(checkBooted.bind(this, port), 500);
                } else {
                    var wait = 0;
                    if (process.platform == 'win32') {
                        wait = 30000;
                    } else if (process.platform == 'darwin') {
                        wait = 3000;
                    }

                    setTimeout(function () {
                        spinner.stop();
                        defer.resolve({port: port});
                    }, wait);
                }
            });
        }
        
        var port = 5554;
        var cmd = userHome + '/platforms/android/sdk/tools/emulator -wipe-data -avd ' + name + ' -port ' + port + ' -gpu on';

        shell.exec(cmd, {
            async: true
        }, function(code, output) {
            if (code !== 0) {
                defer.reject(output);
            }
        });

        // start polling for device ready
        spinner.start();
        checkBooted(port);

        return defer.promise;
    }
};
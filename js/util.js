const base64ArrayBufferInUtils = (arrayBuffer) => {
    var base64 = ''
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

    var bytes = new Uint8Array(arrayBuffer)
    var byteLength = bytes.byteLength
    var byteRemainder = byteLength % 3
    var mainLength = byteLength - byteRemainder

    var a, b, c, d
    var chunk

    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
        // Combine the three bytes into a single integer
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

        // Use bitmasks to extract 6-bit segments from the triplet
        a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
        b = (chunk & 258048) >> 12 // 258048   = (2^6 - 1) << 12
        c = (chunk & 4032) >> 6 // 4032     = (2^6 - 1) << 6
        d = chunk & 63 // 63       = 2^6 - 1

        // Convert the raw binary segments to the appropriate ASCII encoding
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
        chunk = bytes[mainLength]

        a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

        // Set the 4 least significant bits to zero
        b = (chunk & 3) << 4 // 3   = 2^2 - 1

        base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

        a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
        b = (chunk & 1008) >> 4 // 1008  = (2^6 - 1) << 4

        // Set the 2 least significant bits to zero
        c = (chunk & 15) << 2 // 15    = 2^4 - 1

        base64 += encodings[a] + encodings[b] + encodings[c] + '='
    }

    return base64
}
export class Util {
    static arrayBufferToBase64(arrayBuffer) {
        return base64ArrayBufferInUtils(arrayBuffer);
    }
    static sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }
    static async sleepUntil(interval, timeout, condition) {
        var timePassed = 0;
        while (!condition() && timePassed < timeout) {
            //still waiting
            await Util.sleep(interval);
            timePassed += interval;
        }
    }
    static toClass(value) {
        return {}.toString.call(value);
    }
    static isSubTypeOf(value, name) {
        if (!value) return;

        if (!Util.isString(name)) {
            name = name.name;
        }
        var superType = Object.getPrototypeOf(Object.getPrototypeOf(value));

        while (superType ? true : false) {
            const constructorName = superType.constructor.name;
            if (constructorName == "Object") return false;

            if (constructorName == name) return true;

            superType = Object.getPrototypeOf(superType);
        }
        return false;
    }
    static getType(value) {
        if (!value) return null;

        return value.constructor.name;
    }
    static isType(value, name) {
        if (value === null || value === undefined || !name) return false;

        return value.constructor.name == name;
    }
    static isString(value) {
        return Util.isType(value, "String");
    }
    static isFile(value) {
        return Util.isType(value, "File");
    }
    static isNumber(value) {
        return Util.isType(value, "Number");
    }
    static isBoolean(value) {
        return Util.isType(value, "Boolean");
    }
    static isFunction(value) {
        return Util.isType(value, "Function");
    }
    static isArray(value) {
        return Util.isType(value, "Array") || Util.isSubTypeOf(value, "Array");
    }
    static isFile(value) {
        return Util.isType(value, "File");
    }
    static isFormData(value) {
        return Util.isType(value, "FormData");
    }
    static async tryOrNull(block) {
        try {
            return await block();
        } catch {
            return null;
        }
    }
    //same items, same order
    static arraysEqual(array1, array2){
        return array1.length === array2.length && array1.every((value, index) => value === array2[index])
    }
    //same items, any order
    static arraysMatch(array1, array2){
        const array2Sorted = array2.slice().sort();
        return array1.length === array2.length && array1.slice().sort().every(function(value, index) {
            return value === array2Sorted[index];
        });
    }
    //same items, any order
    static manyArraysMatch(array1, ...others){
        if(!others) return array1 ? true : false;

        return others.some(array2 => Util.arraysMatch(array1,array2));
    }

    static getCurrentUrl() {
        return self.location.href;
    }
    static redirectToHttpsIfNeeded() {
        const currentUrl = window.location.href;
        if (currentUrl.startsWith("https") || currentUrl.includes("localhost")) return;

        const httpsUrl = currentUrl.replace("http:", "https:");
        window.location.href = httpsUrl;
    }
    static get isInServiceWorker() {
        return navigator.serviceWorker ? false : true;
    }
    static get serviceWorkerHasClients() {
        if (!Util.isInServiceWorker) return false;

        return (async () => {
            const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
            if (clients && clients.length > 0) return true;

            return false;
        })();
    }
    static async openWindow(url, options) {
        if (!Util.isInServiceWorker) {
            //If URL is http we can't download because we're https and Chrome doesn't allow it.            
            if (url.startsWith("http:")) {
                url = url.replace("&download=1", "").replace("?download=1", "");
            }
            if (options && options.popup) {
                const width = options.popup.width || 250;
                const height = options.popup.height || 250;
                const top = screen.height - height;
                const left = screen.width - width;
                return window.open(url, 'popUpWindow', `height=${height},width=${width},left=${left},top=${top},resizable=no,scrollbars=no,toolbar=no,menubar=no,location=no,directories=no,status=no`);
            } else {
                return window.open(url, '_blank');
            }
        } else {
            var result = null;
            try {
                console.log("Trying to open URL in serviceWorker", url);
                result = await clients.openWindow(url);
            } catch (error) {
                result = error;
            }
            console.log("Result opening URL in serviceWorker", result);
            return result;
        }
    }
    static async setClipboardText(value) {
        return await navigator.clipboard.writeText(value)
        console.log("Set clipboard text", value)
    }
    static getClipboardText() {
        if (!this.canReadClipboard) return null;

        return navigator.clipboard.readText()
    }
    static get clipboardText() {
        return Util.getClipboardText();
    }
    static get canReadClipboard() {
        return (navigator.clipboard && navigator.clipboard.readText) ? true : false
    }
    static async join(array, joiner, func) {
        const funced = [];
        for (const item of array) {
            funced.push(await func(item));
        }
        return funced.join(joiner);
    }
    static withTimeout(promise, timeMs) {
        let timeout = new Promise((resolve, reject) => {
            let id = setTimeout(() => {
                clearTimeout(id);
                reject('Timed out in ' + timeMs + 'ms.')
            }, timeMs)
        })

        // Returns a race between our timeout and the passed in promise
        return Promise.race([
            promise,
            timeout
        ])
    }
    static async getLocation() {
        const higAccuracy = new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 10000
            });
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });
        });
        try {
            return await higAccuracy;
        } catch (error) {
            console.log(error);
            return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
        }
    }
    static isBase64ImageUrl(url) {
        return url && url.startsWith("data:image/png;base64");
    }
    static getBase64ImageUrl(base64Image) {
        if (!base64Image) return base64Image;
        if (base64Image.startsWith("data:image/png;base64")) {
            return base64Image;
        }
        return `data:image/png;base64,${base64Image}`;
    }
    static getBase64SvgUrl(svgXml) {
        return `data:image/svg+xml,${svgXml}`;
    }
    /**
     * 
     * @param {String} src Any src like http, base64, <svg> etc.
     * @returns {String} A src suitable string or null if the input is not compatible
     */
    static async getUsableImgSrc({ src, convertToData, token }) {
        if (!src) return null;

        if (src.startsWith("data:image/")) return src;
        if (src.includes("<svg")) return Util.getBase64SvgUrl(src);
        if (convertToData) {
            src = await Util.getImageAsBase64(src, token);
        }
        return src;
    }
    static getQueryParameterValue(key, url = (window ? window.location.search : null)) {
        if (url.includes("?")) {
            url = url.substring(url.indexOf("?"));
        }
        const urlParams = new URLSearchParams(url);
        return urlParams.get(key);
    }
    static getQueryObject(url = (window ? window.location.search : null)) {
        const urlParams = new URLSearchParams(url);
        const result = {};
        for (const entry of urlParams.entries()) {
            result[entry[0]] = entry[1];
        }
        return result;
    }
    static get isNotificationPopup() {
        return Util.getQueryObject().notificationpopup ? true : false;
    }
    static async import(script, ...classes) {
        const imported = await import("./eventbus.js");
        const hasClasses = classes.length > 0;
        for (const prop in imported) {
            if (hasClasses && !classes.includes(prop)) continue;

            window[prop] = imported[prop];
        }
        return imported;
    }
    static getImageAsBase64(url, authToken) {
        return new Promise((resolve, reject) => {
            if (url == null || url == "") {
                reject("No URL");
                return;
            }
            if (url.startsWith("data:image/png;base64")) {
                resolve(url);
                return;
            }
            if (url.indexOf("http") < 0) {
                resolve(Util.getBase64ImageUrl(url));
                return;
            }
            console.log("Getting binary: " + url);
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            if (authToken) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + authToken);
            }
            xhr.responseType = 'arraybuffer';
            xhr.onload = function (e) {
                resolve(base64ArrayBufferInUtils(e.currentTarget.response));
            };
            xhr.onerror = function (e) {
                reject(e);
            };
            xhr.send();
        }).then(base64Image => Util.getBase64ImageUrl(base64Image));
    }
    static replaceAll(string, replaceThis, withThis) {
        if (!Util.isString(string)) return string;

        return string.split(replaceThis).join(withThis);
    }
    static errorPromise(errorMessage) {
        return Promise.reject(new Error(errorMessage))
    }
    static changeUrl(newUrl) {
        if (!window.history) return;

        let localPath = window.document.location.href
        if (localPath.startsWith("file://") && (newUrl.startsWith("?") || newUrl.startsWith("/?"))) {
            if (newUrl.startsWith("/?")) {
                newUrl = newUrl.substring(1);
            }
            const indexOfQuestion = localPath.indexOf("?");
            if (indexOfQuestion > 0) {
                localPath = localPath.substring(0, indexOfQuestion);
            }
            newUrl = `${localPath}${newUrl}`;
        }
        window.history.pushState({}, null, newUrl);
    }
    static listenToUrlChanges(callback){
        window.onpopstate = callback;
        window.onpush
    }
    static getCurrentUrlWithParameters(parameters) {
        const currentUrl = self.window.document.location.href;
        if (!parameters) return currentUrl;

        const currentParameters = Util.getQueryObject(currentUrl);
        for (const currentParameterName in currentParameters) {
            if (parameters[currentParameterName]) continue;

            parameters[currentParameterName] = currentParameters[currentParameterName];
        }
        let url = currentUrl.split('?')[0];
        for (const parameterName in parameters) {
            let parameterValue = parameters[parameterName];
            if (!parameterValue) continue;

            parameterValue = encodeURIComponent(parameterValue);
            const prefix = url.includes("?") ? "&" : "?";
            url = `${url}${prefix}${parameterName}=${parameterValue}`;
        }
        return url;
    }
    static async importAndInstantiate(script, clazz, params) {
        const imported = await import(script);
        const Class = imported[clazz];
        const instance = new Class(params);
        return instance;
    }
    static getPastedFiles(pasteEvent) {
        const items = pasteEvent.clipboardData.items;
        if (!items) return [];

        const pastedFiles = Array.from(items).map(item => item.getAsFile()).filter(file => file ? true : false);
        return pastedFiles;
    }
    static get areCookiesEnabled() {
        // Quick test if browser has cookieEnabled host property
        if (navigator.cookieEnabled) return true;
        // Create cookie
        document.cookie = "cookietest=1";
        var ret = document.cookie.indexOf("cookietest=") != -1;
        // Delete cookie
        document.cookie = "cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT";
        return ret;
    }
    /**
     * 
     * @param {String} image 
     */
    static getImageUrl(image) {
        if (!image) return null;
        if (image.startsWith("http")) return image;
        if (image.startsWith(".")) return image;
        if (image.startsWith("data:image")) return image;

        return `data:image/png;base64,${image}`;
    }
    static getFormatedFileSize(bytes, si = false, dp = 1) {
        const thresh = si ? 1000 : 1024;

        if (Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }

        const units = si
            ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
            : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        let u = -1;
        const r = 10 ** dp;

        do {
            bytes /= thresh;
            ++u;
        } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


        return bytes.toFixed(dp) + ' ' + units[u];
    }
    static shadeBlendConvert(p, from, to) {
        let sbcRip = function (d) {
            var l = d.length, RGB = new Object();
            if (l > 9) {
                d = d.split(",");
                if (d.length < 3 || d.length > 4) return null;//ErrorCheck
                RGB[0] = i(d[0].slice(4)), RGB[1] = i(d[1]), RGB[2] = i(d[2]), RGB[3] = d[3] ? parseFloat(d[3]) : -1;
            } else {
                if (l == 8 || l == 6 || l < 4) return null; //ErrorCheck
                if (l < 6) d = "#" + d[1] + d[1] + d[2] + d[2] + d[3] + d[3] + (l > 4 ? d[4] + "" + d[4] : ""); //3 digit
                d = i(d.slice(1), 16), RGB[0] = d >> 16 & 255, RGB[1] = d >> 8 & 255, RGB[2] = d & 255, RGB[3] = l == 9 || l == 5 ? r(((d >> 24 & 255) / 255) * 10000) / 10000 : -1;
            }
            return RGB;
        };
        if (typeof (p) != "number" || p < -1 || p > 1 || typeof (from) != "string" || (from[0] != 'r' && from[0] != '#') || (typeof (to) != "string" && typeof (to) != "undefined")) return null; //ErrorCheck

        var i = parseInt, r = Math.round, h = from.length > 9, h = typeof (to) == "string" ? to.length > 9 ? true : to == "c" ? !h : false : h, b = p < 0, p = b ? p * -1 : p, to = to && to != "c" ? to : b ? "#000000" : "#FFFFFF", f = sbcRip(from), t = sbcRip(to);
        if (!f || !t) return null; //ErrorCheck
        if (h) return "rgb(" + r((t[0] - f[0]) * p + f[0]) + "," + r((t[1] - f[1]) * p + f[1]) + "," + r((t[2] - f[2]) * p + f[2]) + (f[3] < 0 && t[3] < 0 ? ")" : "," + (f[3] > -1 && t[3] > -1 ? r(((t[3] - f[3]) * p + f[3]) * 10000) / 10000 : t[3] < 0 ? f[3] : t[3]) + ")");
        else return "#" + (0x100000000 + (f[3] > -1 && t[3] > -1 ? r(((t[3] - f[3]) * p + f[3]) * 255) : t[3] > -1 ? r(t[3] * 255) : f[3] > -1 ? r(f[3] * 255) : 255) * 0x1000000 + r((t[0] - f[0]) * p + f[0]) * 0x10000 + r((t[1] - f[1]) * p + f[1]) * 0x100 + r((t[2] - f[2]) * p + f[2])).toString(16).slice(f[3] > -1 || t[3] > -1 ? 1 : 3);
    }
    static isColorLight(color) {
        const c = color.substring(1);
        const rgb = parseInt(c, 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >> 8) & 0xff;
        const b = (rgb >> 0) & 0xff;

        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        return luma > 200;
    }
    static removeIf(array, condition) {
        if (!array || array.length == 0) return;

        for (let index = 0; index < array.length; index++) {
            const item = array[index];
            if (!condition(item)) continue;

            array.splice(index, 1);
            index--;
        }
        return array;
        // const notInCondition = array.filter(item=>!condition(item));
        // array.length = 0;
        // notInCondition.forEach(item=>array.push(item));
        // return array;
    }
    static get darkModeEnabled() {
        const result = darkModeMediaQuery();
        if (!result) return false;
        return result.matches
    }
    /**
     * 
     * @param {Function} callback Will receive true if dark enabled, false if light
     */
    static watchDarkModeChanges(callback) {
        darkModeMediaQuery().addListener((e) => {
            const darkModeOn = e.matches;
            callback(darkModeOn);
        });
    }
    static get uuid() {
        return new Date().getTime().toString();
    }
    static debounce(func, wait, immediate) {
        var timeout;
        return debouncedArgs => {
            var later = () => {
                timeout = null;
                if (!immediate) func(debouncedArgs);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(debouncedArgs);
        };
    }
    static getNumbers(str, minNumber) {
        if (!str) return null;

        const regexString = `[0-9\.]{${minNumber},}`;
        const regex = new RegExp(regexString, "g");
        return str.match(regex);
    }
    static get2FactorAuthNumbers(str) {
        return Util.getNumbers(str, 4);
    }
    static cloneObject(obj) {
        return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
    }
    static fixUrlForTestServerIfNeeded(url) {
        if (!location.href.includes("https://tests")) return url;

        return url.replace("https://taskernet", "https://testsjoaomgcd.appspot");
    }
    static showError(error){
		const errorMessage = (error.getMessage && error.getMessage()) ? error.getMessage() : error;
        alert(errorMessage);
        console.error(error);
    }
    static sendEmail({to = "support@joaoapps.com",subject,body}){
		window.open(`mailto:${to}?subject=[TaskerNet] ${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
	};
    static setViewportHeightCssVariable(variableName){
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--'+variableName, `${vh}px`);
    }
    static monitorWindowResizesAndUpdateCssVariable(variableName){
        Util.setViewportHeightCssVariable(variableName);
        window.addEventListener('resize', () => {
            Util.setViewportHeightCssVariable(variableName);
          });
    }
}

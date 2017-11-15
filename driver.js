;(function(name, definition) {
    // 檢測上下文環境是否為AMD或CMD
    var hasDefine = typeof define === 'function';
    // 檢查上下文環境是否為Node
    var hasExports = typeof module !== 'undefined' && module.exports;

    if (hasDefine) {
    // AMD環境或CMD環境
        define(definition);
    } else if (hasExports) {
    // 定義為普通Node模塊
        module.exports = definition();
    } else {
    // 將模塊的執行結果掛在window變量中，在瀏覽器中this指向window對象
        this[name] = definition();
    }
})('Driver', function() {
    // system setting
    Storage.prototype.setObject = function(key, value) {
        this.setItem(key, JSON.stringify(value));
    };

    Storage.prototype.getObject = function(key) {
        var value = this.getItem(key);
        return value && JSON.parse(value);
    };

    var Driver = function(settings) {
        let defaultConfigs = {
            domain: 'http://jatantan.app',
            pageAmount: 20
        };
        _settings = $.extend(true, defaultConfigs, settings);
        this.Configs = _settings;
        this.writeLog('Driver Start: ' + Date());

        // 設定 全域變數
        this.setData(_settings.data);
        // 執行排程
        this.runThread(_settings.threads);
        localStorage.clear();
    };


    // runFunc
    Driver.prototype.runCond = function(target, op, value) {
        res = this.getData(target);
        target = res.data;

        if (op === '>' && target > value) return true;
        if (op === '>=' && target >= value) return true;
        if (op === '=' && target === value) return true;
        if (op === '<' && target < value) return true;
        if (op === '<=' && target <= value) return true;
        return false;
    };


    Driver.prototype.runThread = function(options) {
        for (var key in options) {
            let config = options[key];
            // before
            // 不會帶入 settings
            if (config.hasOwnProperty('before')) {
                console.log(this.runBefore(config.before));
                if (!this.runBefore(config.before)) {
                    return true;
                }
            }
            // runFunc
            // 會帶入 settings

            if (config.hasOwnProperty('runFunc')) {
                this.runFunc(config.runFunc, config.settings);
            }
        }
    };

    // 用來 執行 回傳類型的 boolen 的 方法,
    // 比較嚴格, 假如為false, 則 此thread 不執行, threads繼續
    Driver.prototype.runBefore = function(object = {}) {
        if (typeof object !== 'object') {
            return false;
        } else if (object.hasOwnProperty('length')) {
            return false;
        } else if (object === 'undefined' || object === false) {
            return false;
        }

        for (let func in object) {
            if (object[func].hasOwnProperty('length') && typeof this[func] === 'function') {
                if (this[func].apply(this, object[func])) { // 執行 this 內的方法
                    return true;
                } else {
                    // func 回傳 false 或 undefined
                    return false;
                }
            } else {
                // threads 內設定不符合
                return false;
            }
        }
    };

    // get date value
    Driver.prototype.getData = function(target) {
        // 預設
        let res = {
            'data': target,
            'settings': false
        };

        target = target.split('.');
        if (target.length > 0) {
            if (target[0] === 'this') {
                // 尋找全域變數
                target[0] = 'driver';
                settings = (typeof this.Configs.data[target[2]] === 'undefined') ? false : this.Configs.data[target[2]];
            } else {
                settings = false;
            }

            // 尋找 指定來源的值
            for (var i = 0; i < target.length; i++) {
                if (i === 0) {
                    func = window[target[0]];
                } else {
                    func = func[target[i]];
                }
            }
            res.data = func;
            res.settings = settings;
        }

        return res;
    };

    //
    Driver.prototype.setData = function(options) {
        let data = {};
        for (let key in options) {
            if (typeof options[key] === 'object' && this.checkMustHasPy('checkDataPy', options[key])) {
                if (options[key].type === 'ajax') {
                    let json = {};
                    let $this = options[key];
                    json = this.runAjax.apply(this, $this.config.params);
                    if (!$.isEmptyObject(json) && json.code === 200) {
                        data[key] = json.data;
                    }
                }
            } else if (typeof options[key] === 'string' && options[key] !== '') {
                data[key] = options[key];
            } else if (typeof options[key].length !== 'undefined' && options[key].length > 0) {
                data[key] = options[key];
            } else {
                // 條件不正確的不保存
            }
        }
        this.data = data;
    };

    // 檢查 obj 內需要有的keys
    Driver.prototype.checkMustHasPy = function(key, obj) {
        if ($.isEmptyObject(obj)) {
            return false;
        }
        register = {
            'checkDataPy': ['type'],
            'checkColumnsPy': ['title', 'type']
        };
        for (var i = 0; i < register[key].length; i++) {
            if (typeof obj[register[key][i]] === 'undefined') {
                return false;
            }
        }
        return true;
    };

    // Ajax
    Driver.prototype.runAjax = function(url = 'get_ip_info', type = 'get', data = {}, options = {}) {
        let _options = {
            url: url,
            type: type,
            async: false,
            dataType: 'json',
            data: (type === 'get') ? $.param(data) : JSON.stringify(data),
            beforeSend: function(xhr) {
                sess = 'guest';
                if (localStorage.getObject('user') && localStorage.getObject('user')['sess']) {
                    sess = localStorage.getObject('user')['sess'];
                }
                xhr.setRequestHeader('HTTP_X_SESSION', sess);
            }
        };
        if (!$.isEmptyObject(options)) {
            _options = $.extend(true, _options, options);
        }

        let result = $.ajax(_options);
        let json = JSON.parse(result.responseText); // jQuery.parseJSON

        return json;
    };

    // 寫入Logs
    Driver.prototype.writeLog = function(str) {
        if (typeof this.Logs === 'undefined') {
            this.Logs = [];
        }
        this.Logs.push(str);
    };

    return Driver;
});

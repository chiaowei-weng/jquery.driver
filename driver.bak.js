(function($) {
    // system setting
    Storage.prototype.setObject = function(key, value) {
        this.setItem(key, JSON.stringify(value));
    };

    Storage.prototype.getObject = function(key) {
        var value = this.getItem(key);
        return value && JSON.parse(value);
    };

    // 要再想個更複雜的function名,...不然會被覆蓋
    function Driver(settings) {
        let defaultConfigs = {
            domain: 'http://jatantan.app',
            pageAmount: 20
        };
        this.defaultConfigs = $.extend(true, defaultConfigs, settings);
        this.writeLog('Driver Start: ' + Date());
    }

    // drawTable
    // ...
    Driver.prototype.drawTable = function(target, data, template = '', settings) {
        if (typeof data === 'string') {
            // get data
            res = this.getData(data);
            data = res.data;
            settings = $.extend(true, settings, res.settings);
        }
        // data 錯誤
        if (typeof data !== 'object' || !data.hasOwnProperty('length') || data.length == 0) {
            return true;
        }

        // 指定 htmlTag
        if (typeof target === 'object' && !target.length === 1) {
            $this = target;
        } else if (typeof target === 'string') {
            $this = $(target);
        } else {
            return false;
        }
        console.log($this);
        // head
        let thead_data = [];
        if (typeof settings.columns === 'object' && settings.columns.length > 0) {
            thead_data = settings.columns;
        } else {
            thead_data = Object.keys(data[0]);
        }
        $thead = this.drawTableHead('', thead_data, settings);
        // body


        // table
        $table = $('<div>', {'style': 'display: table;'});
        // 假如有 外層樣式, 則尋找 template 內的 target 取代 然後再取代 web 內的 target
        if (typeof template === 'string' && template[0] === '<') {

        } else if (typeof settings.templates === 'object' && settings.templates[template][0] === '<') {

        }
    };

    // drawTableHead
    // ...
    Driver.prototype.drawTableHead = function(template, data = [], settings) {
        if (typeof data === 'string') {
            res = this.getData(data);
            data = res.data;
        }
        // data 錯誤
        if (typeof data !== 'object' || !data.hasOwnProperty('length') || data.length == 0) {
            return true;
        }

        let $thead = $('<div/>', {'style': 'display:table-header-group;'});
        let $tr = $('<div/>', {'style': 'display:table-row;'});
        for (let i = 0; i < data.length; i++) {
            let $th = $('<div/>', {'text': data[i], 'style': 'display:table-cell;'});
            $tr.append($th);
        }
        $thead.append($tr);

        return $thead;
    };

    // drawTableBody
    // ...
    Driver.prototype.drawTableBody = function() {};

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
    // get date value
    Driver.prototype.getData = function(target) {
        let res = {
            'data': target,
            'settings': false
        };
        target = target.split('.');
        if (target.length > 0) {
            if (target[0] === 'this') {
                // 尋找全域變數
                target[0] = 'driver';
                settings = (typeof this.defaultConfigs.data[target[2]] === 'undefined') ? false : this.defaultConfigs.data[target[2]];
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

    Driver.prototype.runThread = function(options) {
        for (var key in options) {
            let config = options[key];
            // before
            // 不會帶入 settings
            if (config.hasOwnProperty('before')) {
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

    // 主要執行, 每個設定的 function 都應該執行一次
    Driver.prototype.runFunc = function(object = {}, settings = {}) {
        if (typeof object !== 'object') {
            return false;
        } else if (object.hasOwnProperty('length')) {
            return false;
        } else if (object === 'undefined' || object === false) {
            return false;
        }

        for (var func in object) {
            if (object[func].hasOwnProperty('length') && typeof this[func] === 'function') {
                if (typeof settings === 'object') {
                    object[func].push(settings); // 最後一個參數帶入 settings,類型為object
                }
                this[func].apply(this, object[func]);
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

    // Jquery
    $.fn.driver = function(settings) {
        let _defaultSettings = {
            auto_init: true,
            data: {
                // 首先執行,並放入 this.data 裡
            },
            columns: {
                // 靜態規範
            },
            threads: {
                // 排程
            }
        };
        var _settings = $.extend(true, _defaultSettings, settings);
        var _init = function() {
            // 從這裡開始
            // 假如 是 jquery 的話, 初始範圍就是 jquery 元素
            _defaultSettings.el = this;

            driver = new Driver(_settings);
            // 設定 全域變數
            driver.setData(_settings.data);
            // 執行排程
            driver.runThread(_settings.threads);
            localStorage.clear();
        };

        if (_settings.auto_init) {
            return this.each(_init);
        }
    };
})(jQuery);

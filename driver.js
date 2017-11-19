(function(name, definition) {
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

    // 設定 url query
    queries = this.getUrlQuery();
    this.setData(queries);

    // 執行排程
    this.runThread(_settings.threads);
    localStorage.clear();
  };

  // drawLabel
  Driver.prototype.drawLabel = function(data, settings) {
    $label = $('<label/>', {'text': data});

    return $label;
  };

  // drawTable
  // ...
  Driver.prototype.drawTable = function(target, data, settings) {
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
    // head
    let thead_data = [];
    if (typeof settings.columns === 'object' && settings.columns.length > 0) {
      thead_data = settings.columns;
    } else {
      thead_data = Object.keys(data[0]);
    }
    $thead = this.drawTableHead('', thead_data, settings);

    // body
    $tbody = this.drawTableBody('', data, settings);

    // footer
    let tfooter_data = {};
    $tfoor = this.drawTableFoot('', tfooter_data, settings);

    // table
    $table = $('<div>', {'style': 'display: table;', 'class': 'table'});
    // 假如有 外層樣式, 則尋找 template 內的 target 取代 然後再取代 web 內的 target
    if (typeof template === 'string' && template[0] === '<') {
      //
    } else if (typeof settings.templates === 'object' && settings.templates[template][0] === '<') {
      //
    }

    $table.append($thead).append($tbody);
    $this.replaceWith($table);
  };

  Driver.prototype.drawTableBody = function(template, data = [], settings) {
    if (typeof data === 'string') {
      res = this.getData(data);
      data = res.data;
    }
    // data 錯誤
    if (typeof data !== 'object' || !data.hasOwnProperty('length') || data.length == 0) {
      return true;
    }

    let columns = this.Configs.columns;
    let $tbody = $('<div/>', {'style': 'display:table-row-group;'});
    for (let i = 0; i < data.length; i++) {
      let $tr = $('<div/>', {'style': 'display:table-row;'});
      for (let column in data[i]) {
        $td = $('<div/>', {'text': data[i][column], 'style': 'display:table-cell;'});
        if (columns.hasOwnProperty(column)) {
          if (this.data.method && columns[column].hasOwnProperty(this.data.method)) {
            let params = [];
            let method = this.data.method;
            let func = columns[column][method];

            params.push(data[i][column]);
            if (columns[column].config && columns[column].config[method]) {
              params.push(columns[column].config[method]);
            }
            func = func.split('.');
            let $template = this[func[1]].apply(this, params);
            if ($template.length > 0) {
              $td = $template;
            }
          }
        }
        $tr.append($td);
      }

      $tbody.append($tr);
    }
    return $tbody;
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

    let $thead = $('<div/>', {'style': 'display:table-header-group;', 'class': 'thead'});
    let $tr = $('<div/>', {'style': 'display:table-row;'});
    for (let i = 0; i < data.length; i++) {
      let title = this.getTitle(data[i]);
      let $th = $('<div/>', {'text': title, 'style': 'display:table-cell;'});
      $tr.append($th);
    }

    $thead.append($tr);
    return $thead;
  };

  // drawTableBody
  // ...
  Driver.prototype.drawTableFoot = function(template, data = [], settings) {
    if (typeof data === 'string') {
      res = this.getData(data);
      data = res.data;
    }
    // data 錯誤
    if (typeof data !== 'object' || !data.hasOwnProperty('length') || data.length == 0) {
      return true;
    }

    let $tfoot = $('<div/>', {'style': 'display:table-footer-group;'});
    let $tr = $('<div/>', {'style': 'display:table-row;'});
    for (let i = 0; i < data.length; i++) {
      let $td = $('<div/>', {'text': i, 'style': 'display:table-cell;'});
      $tr.append($td);
    }

    $tfoot.append($tr);
    return $tfoot;
  };

  // getTitle
  Driver.prototype.getTitle = function(target, columns = {}) {
    if ($.isEmptyObject(columns)) {
      columns = this.Configs.columns;
    }
    if (columns[target] && columns[target].title) {
      return columns[target].title;
    }
    //
    return target;
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

  // get date value
  Driver.prototype.getData = function(target) {
    // 預設
    let res = {
      'data': target,
      'settings': false
    };
    target = target.split('.');
    if (target.length > 0) {
      res.data = this.data[target[2]];
      res.settings = this.Configs.data[target[2]];
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

    this.data = $.extend(true, this.data, data);
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

  //
  Driver.prototype.getUrlQuery = function(param) {
    let strUrl = location.search;
    let getPara, ParaVal;
    let aryPara = [];

    if (strUrl.indexOf('?') != -1) {
      let getSearch = strUrl.split('?');
      getPara = getSearch[1].split('&');
      for (i = 0; i < getPara.length; i++) {
        ParaVal = getPara[i].split('=');
        aryPara[ParaVal[0]] = ParaVal[1];
      }
      return aryPara;
    }
  };

  return Driver;
});

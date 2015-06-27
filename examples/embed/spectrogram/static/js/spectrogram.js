(function() {
  var RadialHistogramPlot, SimpleXYPlot, SpectrogramApp, SpectrogramPlot, find, setup, timer, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = Bokeh._;
  $ = Bokeh.$;

  find_glyph_renderer = function(index_item) {
    for (r in index_item.renderers) { 
        if ( index_item.renderers[r].model.get('data_source') !== undefined ) {
            return index_item.renderers[r].model
        }
    }
    return null;
  };

  get_plot_id = function(id) {
      item = $('#' + id + ' > .plotdiv');
      if (item.length == 1) {
        return item[0].id;
      }
      return null;
  }

  SpectrogramApp = (function() {
    function SpectrogramApp(keys) {
      var config,
        _this = this,
        equalizer_id, 
        spectrogram_id,
        signal_id,
        spectrum_id, 
        gain_id, 
        freq_id;

      equalizer_id = get_plot_id('equalizer');
      spectrogram_id = get_plot_id('spectrogram');
      signal_id = get_plot_id('signal');
      console.log(signal_id);
      spectrum_id = get_plot_id('spectrum');
      freq_id = get_plot_id('freq-slider');
      gain_id = get_plot_id('gain-slider');
     
      for (i in keys) {
          var item, 
              item_id;
          item = Bokeh.index[keys[i]];
          item_id = item.el.id;
          if ( item_id === equalizer_id ) this.equalizer = item;
          if ( item_id === spectrogram_id ) this.spectrogram = item;
          if ( item_id === signal_id ) this.signal = item;
          if ( item_id === spectrum_id ) this.spectrum = item;
          if ( item_id === gain_id ) this.gain_slider = item;
          if ( item_id === freq_id ) this.freq_slider = item;
      };

      this.request_data = __bind(this.request_data, this);
      this.update_gain = __bind(this.update_gain, this);
      this.update_freq = __bind(this.update_freq, this);
      this.paused = false;
      this.gain = 1;
      this.freq_slider.on("change:value", this.update_freq);
      this.gain_slider.on("change:value", this.update_gain);
      config = Bokeh.$.ajax('http://localhost:5000/params', {
        type: 'GET',
        dataType: 'json',
        cache: false
      }).done(function(data, textStatus, jqXHR) {
        return _this._config(data);
      }).then(this.request_data);
    }

    SpectrogramApp.prototype.update_freq = function() {
      var freq;
      freq = this.freq_slider.get('value');
      this.spectrogram_plot.set_yrange(0, freq);
      return this.power_plot.set_xrange(0, freq);
    };

    SpectrogramApp.prototype.update_gain = function() {
      return this.gain = this.gain_slider.get('value');
    };

    SpectrogramApp.prototype._config = function(data) {
      this.config = data;
      console.log("Got config:", this.config);
      this.spectrogram_plot = new SpectrogramPlot(find_glyph_renderer(this.spectrogram), this.config);
      this.signal_plot = new SimpleXYPlot(find_glyph_renderer(this.signal), this.config);
      this.power_plot = new SimpleXYPlot(find_glyph_renderer(this.spectrum), this.config);
      return this.eq_plot = new RadialHistogramPlot(find_glyph_renderer(this.equalizer), this.config);
    };

    SpectrogramApp.prototype.request_data = function() {
      var helper, in_flight, looper,
        _this = this;
      in_flight = false;
      helper = function() {
        if (in_flight) {
          return;
        }
        in_flight = true;
        return Bokeh.$.ajax('/data', {
          type: 'GET',
          dataType: 'json',
          cache: false
        }).fail(in_flight = false).then(function(data) {
          in_flight = false;
          return _this.on_data(data);
        });
      };
      this.interval = Math.floor(1000.0 / this.config.FRAMES_PER_SECOND);
      this.thisTime = Date.now();
      this.lastTime = Date.now();
      looper = function() {
        var delay, timeout;
        _this.thisTime = Date.now();
        _this.deltaTime = _this.thisTime - _this.lastTime;
        delay = Math.max(_this.interval - _this.deltaTime, 0);
        timeout = setTimeout(looper, delay);
        _this.lastTime = _this.thisTime + delay;
        return helper();
      };
      return setTimeout(looper, 0);
    };

    SpectrogramApp.prototype.on_data = function(data) {
      var f, i, power, signal, spectrum, t, x;
      if (_.keys(data).length === 0) {
        return;
      }
      signal = (function() {
        var _i, _len, _ref, _results;
        _ref = data.signal;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          _results.push(x * this.gain);
        }
        return _results;
      }).call(this);
      spectrum = (function() {
        var _i, _len, _ref, _results;
        _ref = data.spectrum;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          _results.push(x * this.gain);
        }
        return _results;
      }).call(this);
      power = (function() {
        var _i, _len, _ref, _results;
        _ref = data.spectrum;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          _results.push(x * x);
        }
        return _results;
      })();
      this.spectrogram_plot.update(spectrum);
      t = (function() {
        var _i, _ref, _results;
        _results = [];
        for (i = _i = 0, _ref = signal.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          _results.push(i / signal.length * this.config.TIMESLICE);
        }
        return _results;
      }).call(this);
      this.signal_plot.update(t, signal);
      f = (function() {
        var _i, _ref, _results;
        _results = [];
        for (i = _i = 0, _ref = spectrum.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          _results.push(i / spectrum.length * this.config.MAX_FREQ);
        }
        return _results;
      }).call(this);
      this.power_plot.update(f, spectrum);
      return this.eq_plot.update(data.bins);
    };

    return SpectrogramApp;

  })();

  SpectrogramPlot = (function() {
    function SpectrogramPlot(model, config) {
      var i, plot, _i, _ref;
      this.model = model;
      this.config = config;
      this.source = this.model.get('data_source');
      this.cmap = new Bokeh.LinearColorMapper.Model({
        palette: Bokeh.Palettes.YlGnBu9,
        low: 0,
        high: 5
      });
      plot = this.model.attributes.parent;
      this.y_range = plot.get('frame').get('y_ranges')[this.model.get('y_range_name')];
      this.num_images = Math.ceil(this.config.NGRAMS / this.config.TILE_WIDTH) + 1;
      this.image_width = this.config.TILE_WIDTH;
      this.images = new Array(this.num_images);
      for (i = _i = 0, _ref = this.num_images - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        this.images[i] = new ArrayBuffer(this.config.SPECTROGRAM_LENGTH * this.image_width * 4);
      }
      this.xs = new Array(this.num_images);
      this.col = 0;
    }

    SpectrogramPlot.prototype.update = function(spectrum) {
      var buf, buf32, i, image32, img, _i, _j, _ref, _ref1;
      buf = this.cmap.v_map_screen(spectrum);
      for (i = _i = 0, _ref = this.xs.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        this.xs[i] += 1;
      }
      this.col -= 1;
      if (this.col === -1) {
        this.col = this.image_width - 1;
        img = this.images.pop();
        this.images = [img].concat(this.images.slice(0));
        this.xs.pop();
        this.xs = [1 - this.image_width].concat(this.xs.slice(0));
        this.source.set('data', {
          image: this.images,
          x: this.xs
        });
      }
      image32 = new Uint32Array(this.images[0]);
      buf32 = new Uint32Array(buf);
      for (i = _j = 0, _ref1 = this.config.SPECTROGRAM_LENGTH; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
        image32[i * this.image_width + this.col] = buf32[i];
      }
      this.source.get('data')['x'] = this.xs;
      return this.source.trigger('change', true, 0);
    };

    SpectrogramPlot.prototype.set_yrange = function(y0, y1) {
      return this.y_range.set({
        'start': y0,
        'end': y1
      });
    };

    return SpectrogramPlot;

  })();

  RadialHistogramPlot = (function() {
    function RadialHistogramPlot(model, config) {
      this.model = model;
      this.config = config;
      this.source = this.model.get('data_source');
    }

    RadialHistogramPlot.prototype.update = function(bins) {
      var alpha, angle, end, i, inner, j, outer, range, start, _i, _j, _ref, _ref1, _ref2, _results;
      angle = 2 * Math.PI / bins.length;
      _ref = [[], [], [], [], []], inner = _ref[0], outer = _ref[1], start = _ref[2], end = _ref[3], alpha = _ref[4];
      for (i = _i = 0, _ref1 = bins.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        range = (function() {
          _results = [];
          for (var _j = 0, _ref2 = Math.min(Math.ceil(bins[i]), this.config.EQ_CLAMP); 0 <= _ref2 ? _j < _ref2 : _j > _ref2; 0 <= _ref2 ? _j++ : _j--){ _results.push(_j); }
          return _results;
        }).apply(this);
        inner = inner.concat((function() {
          var _k, _len, _results1;
          _results1 = [];
          for (_k = 0, _len = range.length; _k < _len; _k++) {
            j = range[_k];
            _results1.push(j + 2);
          }
          return _results1;
        })());
        outer = outer.concat((function() {
          var _k, _len, _results1;
          _results1 = [];
          for (_k = 0, _len = range.length; _k < _len; _k++) {
            j = range[_k];
            _results1.push(j + 2.95);
          }
          return _results1;
        })());
        start = start.concat((function() {
          var _k, _len, _results1;
          _results1 = [];
          for (_k = 0, _len = range.length; _k < _len; _k++) {
            j = range[_k];
            _results1.push((i + 0.05) * angle);
          }
          return _results1;
        })());
        end = end.concat((function() {
          var _k, _len, _results1;
          _results1 = [];
          for (_k = 0, _len = range.length; _k < _len; _k++) {
            j = range[_k];
            _results1.push((i + 0.95) * angle);
          }
          return _results1;
        })());
        alpha = alpha.concat((function() {
          var _k, _len, _results1;
          _results1 = [];
          for (_k = 0, _len = range.length; _k < _len; _k++) {
            j = range[_k];
            _results1.push(1 - 0.08 * j);
          }
          return _results1;
        })());
      }
      this.source.set('data', {
        inner_radius: inner,
        outer_radius: outer,
        start_angle: start,
        end_angle: end,
        fill_alpha: alpha
      });
      return this.source.trigger('change', this.source);
    };

    return RadialHistogramPlot;

  })();

  SimpleXYPlot = (function() {
    function SimpleXYPlot(model, config) {
      var plot;
      this.model = model;
      this.config = config;
      this.source = this.model.get('data_source');
      plot = this.model.attributes.parent;
      this.x_range = plot.get('frame').get('x_ranges')[this.model.get('x_range_name')];
    }

    SimpleXYPlot.prototype.update = function(x, y) {
      this.source.set('data', {
        x: x,
        y: y
      });
      return this.source.trigger('change', this.source);
    };

    SimpleXYPlot.prototype.set_xrange = function(x0, x1) {
      return this.x_range.set({
        'start': x0,
        'end': x1
      });
    };

    return SimpleXYPlot;

  })();

  setup = function() {
    var app, id, index, keys;
    index = window.Bokeh.index;
    keys = _.keys(index);
    if (keys.length === 0) {
      console.log("Bokeh not loaded yet, waiting to set up SpectrogramApp...");
      return;
    }
    clearInterval(timer);
    console.log("Bokeh loaded, starting SpectrogramApp");
    return app = new SpectrogramApp(keys);
  };

  timer = setInterval(setup, 100);

}).call(this);

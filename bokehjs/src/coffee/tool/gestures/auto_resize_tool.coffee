_ = require "underscore"
$ = require "jquery"
GestureTool = require "./gesture_tool"

class AutoResizeToolView extends GestureTool.View

  initialize: (options) ->
    super(options)
    resize_this = $.proxy(@autoresize, @)
    $(window).on("resize", resize_this)
    resize_this()
    return null

  autoresize: () ->
    canvas = @plot_view.canvas
    canvas_height = canvas.get('height')
    canvas_width = canvas.get('width')
    aspect_ratio = canvas_width / canvas_height

    # kiwi.js falls over if we try and resize too small. 
    # 100 works with bokeh's default settings. 
    # It may not be the right number if people set a large border on their plots.
    min_dimention = 100
    new_width = Math.max(@plot_view.el.clientWidth, min_dimention)
    new_height = parseInt(new_width / aspect_ratio)

    if new_height < min_dimention
      new_height = 100
      new_width = new_height * aspect_ratio  # Preserves the aspect ratio

    canvas._set_dims([new_width, new_height])
    return null

class AutoResizeTool extends GestureTool.Model
  default_view: AutoResizeToolView

module.exports =
  Model: AutoResizeTool
  View: AutoResizeToolView

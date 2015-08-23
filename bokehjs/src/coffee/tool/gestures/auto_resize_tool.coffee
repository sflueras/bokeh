ResizeTool = require "./resize_tool"

class AutoResizeToolView extends ResizeTool.View

class AutoResizeTool extends ResizeTool.Model
  type: "AutoResizeTool"
  tool_name: "AutoResize"

module.exports =
  Model: AutoResizeTool
  View: AutoResizeToolView

from __future__ import absolute_import

from bokeh.io import save
from bokeh.plotting import figure

import pytest
pytestmark = pytest.mark.integration


def test_autoresize_tool_causes_plot_to_respond_to_window_size_changing(output_file_url, selenium):

    TOOLS = 'autoresize'  # We use the autoresize tool to make the plots responsive

    PLOT_OPTIONS = dict(tools=TOOLS, plot_width=800, plot_height=400)
    plot = figure(**PLOT_OPTIONS).scatter([1, 2, 3], [3, 2, 3])

    save(plot)
    selenium.get(output_file_url)

    selenium.set_window_size(width=1000, height=600)

    canvas = selenium.find_element_by_tag_name('canvas')
    assert canvas.size['height'] == 400
    assert canvas.size['width'] == 800

    selenium.set_window_size(width=500, height=600)

    canvas = selenium.find_element_by_tag_name('canvas')
    assert canvas.size['height'] != 400
    assert canvas.size['width'] != 800

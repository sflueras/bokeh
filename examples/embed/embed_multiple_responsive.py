from bokeh.browserlib import view
from bokeh.plotting import figure
from bokeh.embed import components
from bokeh.resources import Resources
from bokeh.templates import RESOURCES

from jinja2 import Template
import random

########## BUILD FIGURES ################

PLOT_OPTIONS = dict(plot_width=800, plot_height=300)
SCATTER_OPTIONS = dict(size=12, alpha=0.5)
data = lambda: [random.choice([i for i in range(100)]) for r in range(10)]
p1 = figure(tools='pan,autoresize', **PLOT_OPTIONS).scatter(data(), data(), color="red", **SCATTER_OPTIONS)
p2 = figure(tools='pan', **PLOT_OPTIONS).scatter(data(), data(), color="blue", **SCATTER_OPTIONS)
p3 = figure(tools='pan,autoresize,resize', **PLOT_OPTIONS).scatter(data(), data(), color="green", **SCATTER_OPTIONS)

########## RENDER PLOTS ################

# Define our html template for out plots
template = Template('''<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Responsive plots</title>
        {{ plot_resources }}
    </head>
    <body>
    <h2>Resize the window to see some plots resizing</h2>
    {% for div in plot_div.values() %} {{ div }} {% endfor %}
    {{ plot_script }}
    </body>
</html>
''')

# Setup out resources
resources = Resources(mode='relative-dev')
plot_resources = RESOURCES.render(
    js_raw=resources.js_raw,
    css_raw=resources.css_raw,
    js_files=resources.js_files,
    css_files=resources.css_files,
)

script, div = components({'Red': p1, 'Blue': p2, 'Green': p3})
html = template.render(plot_resources=plot_resources, plot_script=script, plot_div=div)
html_file = 'embed_multiple_responsive.html'
with open(html_file, 'w') as f:
    f.write(html)

view(html_file)

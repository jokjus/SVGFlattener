# SVGFlattener
Flattens / hides elements behind other elements in an svg for pen plotting.
Supports nested groupings and clipping masks.

![Screenshot of SVGFlattener](/img/screenshot3.png)

## Usage
1. Download
2. Run in a browser (for example with Visual Code Live Server plugin)
3. Set parameters from left side menu bar
4. Drag an SVG file to flatten over green area on the screen.
5. See it crunch the image by opening the console of your browser
6. Export the end result as SVG

## Features
- Set minimum stroke width over which lines are expanded into closed paths.
- Use the original colors in the resulting SVG (default is black line with no fill, since intended end use is pen plotting)
- Can handle grouped layers
- Can handle clipping masks
- Can handle compound paths as clipping masks 
- Can properly flatten lines

## Known bugs
- Page size in the end result might be wrong. So even if you wouldn't see anything rendered on screen after processing is completed, export and check the result in vector editor of your choice.

![Example flattened image 1](/img/screenshot1.png)
![Example flattened image 2](/img/screenshot2.png)

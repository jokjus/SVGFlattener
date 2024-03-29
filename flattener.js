// SVG Flattener for pen plotting by Jussi Jokinen 2022-2023
// Removes overlapping lines. 
// Open paths with stroke width above set threshold are expanded
console.log('SVGFlattener by Jussi Jokinen')

let c = {
	lineWidthThreshold: 1,
	expandAllLines: false,
	originalColors: false,
	cookieCutter: false,
	verbose: false
}
	
let drawingLayer = new Layer({
	name: 'drawing'
})

let resultLayer = new Layer({
	name: 'result'
})

// create a dummy path
let b = new Path({
	name: 'unitedSprites',
	parent: resultLayer,
})


// Recursively ungroup the SVG
function ungroup(item, keepCompounds = true) {

	flag = true

	for (var i = 0; i < item.children.length; i++) {
		var el = item.children[i]

		// If item is a group
		if ( el.hasChildren() ) {

			// don't process clipping compound paths
			// if (el.clipMask && el instanceof paper.CompoundPath ) {
			// 	continue
			// }
			if (el instanceof paper.CompoundPath && el.closed && keepCompounds) {				
				continue
			}
			
			// Have to deal with clipping groups first
			if (el.clipped) flattenClipping(el)

			// Move children to parent element and remove the group
			el.parent.insertChildren(el.index, el.removeChildren())
			el.remove()
			flag = false
		}

		// Recurse as long as there are groups left
		if (!flag) {
			ungroup(item)
		}
	}
}

// Flattens a clipping group
function flattenClipping(clipGroup) {

	// Ungroup everything inside a clipping group
	ungroup(clipGroup)

	// Find the clipping mask (it should be the first layer but cannot be certain)
	var clipMasks = clipGroup.children.filter(obj => {
		return obj.clipMask === true
	})

	var clipMaskOrig = clipMasks[0]

	// if clipmask element is a shape, let's convert to a path first
	// this is ugly but didn't yet find other way to prevent extra elements from generating
	if (clipMaskOrig.type != undefined) {
		var clipMask = clipMaskOrig.toPath()		
	}
	else  {
		var clipMask = clipMaskOrig
	}

	// Close clipping mask for more predicatable results
	if (clipMask.closed == false) clipMask.closePath()
	
	// Get the actual clipped layers
	var innerLayers = clipGroup.children.filter(obj => {
		return obj.clipMask === false
	})

	

	// Loop through clipped layers and get the boolean intersection against clone of the clipping mask
	for (var x = 0; x < innerLayers.length; x++) {
		var innerOrig = innerLayers[x]
		var mask = clipMask.clone()
		let origFill = innerOrig.fillColor
		let origStrokeColor = innerOrig.strokeColor
		let origStrokeWidth = innerOrig.strokeWidth

		// if inner element is a shape, let's convert to a path first
		// this is ugly but didn't yet find other way to prevent extra elements from generating
		if (innerOrig.type != undefined) {
			var inner = innerOrig.toPath()	
		}
		else {
			var inner = innerOrig
		}

		// Use suitable tracing method for open and closed paths
		var traceMethod = false
		if (innerOrig.closed || innerOrig.type != undefined) traceMethod = true

		// The boolean operation
		var newEl = inner.intersect(mask, {trace: traceMethod})

		// If the result is a compound path, restore original appearance after boolean operation	
		if (newEl instanceof CompoundPath) {
			newEl.children.forEach(el => el.fillColor = origFill)
			newEl.children.forEach(el => el.strokeColor = origStrokeColor)
			newEl.children.forEach(el => el.strokeWidth = origStrokeWidth)
		}

		// clean up
		mask.remove()
		inner.remove()
		innerOrig.remove()
	}
	
	//clean up	
	clipMask.remove()
	clipMaskOrig.remove()
	clipGroup.clipped = false

}

// Do the hidden line removal
function render() {
	drawingLayer.opacity = 0.1 // show a hint of original drawing
	var elCount = drawingLayer.children.length

	// setup progress indicator
	viewWidth = view.bounds.width
	progIndicator = document.getElementById('progress')
	progIndicatorStep = viewWidth / elCount
	
	// Initialize counter
	var x = elCount - 1

	// Loop through all elements in svg
	function loop() {

		if (c.verbose) console.log('processed: ' + (elCount - x) + ' of ' + elCount)
		
		var el = drawingLayer.children[x]
		
	
		// use variables instead of accessing properties for possible speed advantage
		let fillC, strokeC

		if (el.fillColor != null) fillC = el.fillColor.clone()
		if (el.strokeColor != null) strokeC = el.strokeColor.clone()
		origColor = strokeC == null ? fillC : strokeC

		strokeW = el.strokeWidth
		closed = el.closed
		validEl = true
		
		// stray point object with fill but no dimensions
		if (el.bounds.height == 0 && el.bounds.width == 0) {
			validEl = false
		}
		
		//invisible object, no need to process
		if (fillC == null && strokeC == null) {
			validEl = false
		}
		
		// If element is to be processed
		if (validEl) {

			// take a clone of a current sprite
			var d = el.clone()
			
			// If element is a shape (circle, ellipse, rectangle…), let's convert it to path first
			if (d.type != undefined) {
				if (c.verbose) console.log('Processed elem is a SHAPE')
				d = d.toPath()
			}

			// If there are lines with fillcolor applied, close them (these are visually filled areas so we assume they should be processed as such)
			if (fillC != null && closed == false) {
				d.closePath()
			}		
		
			// If element is a stroke with a wider than threshold width, expand it
			if (strokeW > c.lineWidthThreshold) {
				// If all elements, including closed ones are to be expanded
				if (c.expandAllLines) {
					d = PaperOffset.offsetStroke(el, strokeW, { cap: el.strokeCap, join: el.strokeJoin })
				}				
				else {
					if (!d.closed) d = PaperOffset.offsetStroke(el, strokeW, { cap: el.strokeCap, join: el.strokeJoin })
				}
			}
		
			// If cookie cutter option is not selected
			if (!c.cookieCutter && d.closed) {
			
				// Let's stash the original element in order to add it to the global mask
				fi = d.clone()
				
				// Compound paths need to be processed one sub-path at a time
				if (d instanceof paper.CompoundPath) {
					if (c.verbose) console.log('compound path being processed')
		
					temp = [...d.children]
					d.parent.addChildren(d.children)
		
					// Subtract the mask from each compound path's sub-path individually
					temp.forEach((path, idx, array) => {
						
						path.splitAt(path.firstSegment.location)						
						subtractAndUnite(path, false, origColor)	
						
					})
					
					// Update global mask after all sub-paths have been processed first
					b = b.unite(fi, {insert: false})
					fi.remove()
		
				}

				else {
					// Other than compound closed paths are processed one by one
					d.splitAt(d.firstSegment.location)
					subtractAndUnite(d, fi, origColor)
				}
			}

			// If cookie cutter option IS selected
			else {
				
				if (d.closed) subtractAndUnite(d, d, origColor)
				else subtractAndUnite(d, false, origColor)
				
			}
		}

		x--

		// Check if the loop should continue
		if (x >= 0) {

			// Only update visual progress once per 20 elements in order to speed things up
			if (x % 20 == 0) {

				// Update progress bar width
				progWidth = viewWidth - (progIndicatorStep * x)
				progIndicator.style.width = progWidth + 'px';
				setTimeout(loop, 0)
				
			} else {
				loop()
			}

		} else {
			// Loop finished, perform cleanup
			
			if (c.verbose) console.log('DONE, cleanup')
	
			b = new Path({
				name: 'unitedSprites'
			})

			// Reverse order
			resultLayer.reverseChildren()

			// Ungroup possible resulted compound paths
			ungroup(resultLayer, false)		

			// Remove original paths
			drawingLayer.removeChildren()

			// Clean possible stray points from the result
			resultLayer.children.forEach(path => {
				if (path.bounds.height == 0 && path.bounds.width == 0) {
					path.remove()
				}
			})

			
			
			if (c.originalColors) {
				resultLayer.children.forEach(path => {
					if (path.strokeColor === null) {						
						path.strokeColor = path.fillColor
					}
					path.fillColor = null
					path.strokeWidth = 1
				})
			}
			
			// Set color attributes
			if (!c.originalColors) {
				resultLayer.strokeColor = 'black'
				resultLayer.fillColor = null
				resultLayer.strokeWidth = 1
			}

		}
  }

  // Start the loop
  loop()
			
}
			

function subtractAndUnite(pathToProcess, toUnite = false, origColor) {

	var traceMethod = pathToProcess.closed || pathToProcess.type != undefined ? true : false

	// add processed clone into the result layer
	resultLayer.addChild(pathToProcess)

	// let origColor
	// if (pathToProcess instanceof paper.CompoundPath) {
	// 	origColor = pathToProcess.children[0].strokeColor.clone()
	// }

	// Subtract everything above from the processed element
	res = pathToProcess.subtract(b, {trace: traceMethod}) 	
	
	// Give resulting compound path's subpaths a meaningful strokeColor (so they won't disappear when ungrouping)
	if (res instanceof paper.CompoundPath) {
		// console.log('värejä säädetään')
		res.children.forEach(path => {
			if (path.strokeColor == null) {
				path.strokeColor = origColor
				// path.strokeColor = pathToProcess.fillColor
			}
		})
	}
	
	// If layer is a solid shape
	if (toUnite) {		

		// Unite to previous solid shapes
		b = b.unite(toUnite, {insert: false})
		toUnite.remove()
		// b.strokeColor = 'green'
		// b.fillColor = null
		// b.strokeWidth = 2
		// b.bringToFront()
		// b.parent = resultLayer
	}

	//remove temporary clone
	pathToProcess.remove()		

	res.strokeWidth = 1
	
	if (!c.originalColors) {
		res.strokeColor = 'black'
		res.fillColor = null
	
	} else {
		if (res.strokeColor == null) res.strokeColor = origColor
		res.fillColor = null
	}

	return res
}



// UI listeners ================================================
addListener('lineWidthThreshold')
addListener('originalColors', 'checkbox')
addListener('cookieCutter', 'checkbox')
addListener('expandAllLines', 'checkbox')

function addListener(elId, type) {
	document.getElementById(elId).onchange = function() {

	if (type == null) eval('c.' + elId + ' = this.value')
	if (type == 'checkbox') eval('c.' + elId + ' = this.checked');
  }
}


// Export SVG ========================================================

var  exportButton = document.getElementById('export-button')

exportButton.addEventListener("click", function(e) {
	var svg = project.exportSVG({asString: true})
	var blob = new Blob([svg], {type: "image/svg+xml;charset=utf-8"})
	saveAs(blob, 'image.svg')
}, false)


// Log project ========================================================

// var  projectExportButton = document.getElementById('log-project')

// projectExportButton.addEventListener("click", function(e) {
// 	console.log(project)
// 	console.log(c)
// }, false)


// DRAG'N DROP custom images =========================================
function onDocumentDrag(event) {
	show(document.getElementById('pathTarget'))
	event.preventDefault()
}

function onDocumentDrop(event) {
	event.preventDefault()

	if (event.target.id == 'pathTarget') {
		
		drawingLayer.removeChildren()
		resultLayer.removeChildren()
		document.getElementById('progress').setAttribute('style', 'width:0px');

		drawingLayer.activate()
		if (c.verbose) console.log('Clear canvas')
		var file = event.dataTransfer.files[0]
		var reader = new FileReader()

		reader.onload = function (event) {
			project.layers['drawing'].importSVG(event.target.result, function(item) {
				if (c.verbose) console.log('Import SVG')
				pathImg = item
				pathImg.children[0].remove()
				//let's ungroup imported SVG for easier access. Now paths are bare at words layer.
				pathImg.parent.insertChildren(pathImg.index,  pathImg.removeChildren())
				pathImg.remove()
				if (c.verbose) console.log('Imported SVG, next ungroup')
				ungroup(drawingLayer)
				drawingLayer.fitBounds(view.bounds)
				drawingLayer.scale(0.9)

				if (c.verbose) console.log(drawingLayer)

				render()
			})
		}

		reader.readAsDataURL(file)

		hide(document.getElementById('pathTarget'))
	}
}

document.addEventListener('drop', onDocumentDrop, false)
document.addEventListener('dragover', onDocumentDrag, false)
document.addEventListener('dragleave', onDocumentDrag, false)

// Show an element
var show = function (elem) {
	elem.style.display = 'block'
};

// Hide an element
var hide = function (elem) {
	elem.style.display = 'none'
};
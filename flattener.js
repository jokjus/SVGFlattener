// SVG Flattener for pen plotting by Jussi Jokinen 2022
// Removes overlapping lines. 
// Open paths with stroke width above set threshold are expanded
// Requires ungrouping svg first

var c = {
	lineWidthThreshold: 1
}

var drawingLayer = new Layer({
	name: 'drawing'
})

var resultLayer = new Layer({
	name: 'result'
})


// Recursively ungroup the SVG
function ungroup(item) {

	flag = true

	for (var i = 0; i < item.children.length; i++) {
		var el = item.children[i]

		if (el.hasChildren()) {
			
			// Have to deal with clipping groups first
			if (el.clipped) flattenClipping(el)

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
	var clipMask = clipGroup.children.filter(obj => {
		return obj.clipMask === true
	})

	// Close clipping mask for more predicatable results
	if (clipMask[0].closed == false) clipMask[0].closePath()
	
	// Get the actual clipped layers
	var innerLayers = clipGroup.children.filter(obj => {
		return obj.clipMask === false
	})
 

	// Loop through clipped layers and get the boolean intersection against clone of the clipping mask
	for (var x = 0; x < innerLayers.length; x++) {
		var inner = innerLayers[x]
		var mask = clipMask[0].clone()
		var newEl = inner.intersect(mask)

		// If there are more than one resulting item, they are forced to have color so that later boolean operations will work
		if (newEl.hasChildren()) {
			newEl.children.forEach(el => el.fillColor = 'black')
		}

		// clean up
		mask.remove()
		inner.remove()
	}
	
	
	// ungroup(innerLayers)

	//clean up
	clipMask[0].remove()
	clipGroup.clipped = false

}



function render() {
	var elCount = drawingLayer.children.length

	// create a dummy path
	 var b = new Path({
		name: 'unitedSprites'
	})
	
	// add dummy to result layer
	resultLayer.addChild(b)
	
	// Loop through all elements in svg
	for (var x = elCount - 1; x >= 0; x-- ) {
		
		console.log('processed: ' + (elCount - x) + ' of ' + elCount)

		// take a clone of a current sprite
		var el = drawingLayer.children[x]
		
		if (el.bounds.height == 0 && el.bounds.width == 0) {
			continue
			// stray point object with fill but no dimensions
		}
		
		if (el.fillColor == null && el.strokeColor == null) {
			continue
			//invisible object, no need to process
		}

		var d = el.clone()

		// If there are lines with fillcolor applied, close them
		if (el.fillColor != null && el.closed == false) {
			d.closePath()
		}

		// If element is a shape (circle, ellipse, rectangle…), let's convert it to path first
		if (d.type != undefined) {
			d = d.toPath()
		}
		
		// If element is a stroke with a wider than threshold width, expand it
		if (el.closed == false && el.strokeWidth > c.lineWidthThreshold) {
			d = PaperOffset.offsetStroke(el, el.strokeWidth / 2, { cap: el.strokeCap, join: el.strokeJoin })
		}

		var traceMethod = false
		if (d.closed || d.type != undefined) traceMethod = true

		// add processed clone into the result layer
		resultLayer.addChild(d)

		// Subtract everything above from the processed element
		var sub = d.subtract(b, {trace: traceMethod});

		// Set color attributes
		sub.strokeColor = 'black'
		sub.strokeWidth = 1
		sub.fillColor = null

		// If layer is a solid shape
		if (d.closed || d.type != undefined) {
			// Unite to previous solid shapes
			b = b.unite(d, {insert: false})
		}

		//remove temporary clone
		d.remove()		
	}

	// Clean up
	b.remove()
	resultLayer.children['unitedSprites'].remove()
	drawingLayer.removeChildren()

	// Reverse order
	resultLayer.reverseChildren()
}


// UI listeners ================================================
addListener('lineWidthThreshold')

function addListener(elId, type) {
	document.getElementById(elId).onchange = function() {

	if (type == null) eval('c.' + elId + ' = this.value')
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

var  projectExportButton = document.getElementById('log-project')

projectExportButton.addEventListener("click", function(e) {
	console.log(project)
}, false)


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
		drawingLayer.activate()

		var file = event.dataTransfer.files[0]
		var reader = new FileReader()

		reader.onload = function (event) {
			project.layers['drawing'].importSVG(event.target.result, function(item) {
				pathImg = item
				pathImg.children[0].remove()
				//let's ungroup imported SVG for easier access. Now paths are bare at words layer.
				pathImg.parent.insertChildren(pathImg.index,  pathImg.removeChildren())
				pathImg.remove()
				// flattenClipping(drawingLayer)
				ungroup(drawingLayer)
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
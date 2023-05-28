//js 

var sections = document.getElementsByClassName('ui-section');
var ranges = document.querySelectorAll('input[type=range]');
var numberInputs = document.querySelectorAll('input[type=number]');
var sectionHeadings = document.getElementsByClassName('ui-section-header');



for	(var i = 0; i < sections.length; i++) {
	sections[i].addEventListener('click', function(e) {
		toggleActivity(this);
	}, false); 
};

for	(var i = 0; i < sectionHeadings.length; i++) {
	sectionHeadings[i].addEventListener('click', function(e) {
		expandCollapse(this);
	}, false); 
};

var count = 0;

for (let nInput of numberInputs) {
	var myid = 'smartRange-' + count;
	var myLabel = nInput.previousSibling;	

	nInput.setAttribute('data-smart', myid);

	var range = document.createElement('input');
	range.classList.add('smartRange');
	range.setAttribute('type', 'range');
	range.setAttribute('value', nInput.value);
	range.setAttribute('id', myid);
	range.setAttribute('min', nInput.getAttribute('min'));
	range.setAttribute('max', nInput.getAttribute('max'));
	range.prevent

	range.addEventListener("change", function(e) {
		nInput.value = this.value;
		nInput.dispatchEvent(new Event('change'));
		this.classList.remove('active');
		nInput.classList.remove('active');
	}, false);

	range.addEventListener("input", function(e) {
		nInput.value = this.value;
	}, false);

	nInput.addEventListener("mousedown", function(e) {
		this.classList.add('active');
		var smarts = document.getElementsByClassName('smartRange');
		for (let sm of smarts) { sm.classList.remove('active') }

		document.getElementById(this.dataset.smart).classList.add('active');

	}, false);

	// nInput.addEventListener("blur", function(e) {
	// 	var smarts = document.getElementsByClassName('smartRange');
	// 	for (let sm of smarts) { sm.classList.remove('active') }
	// 	this.classList.remove('active');
	// }, false);

	myLabel.addEventListener("click", function(e) {
		var inp = this.nextSibling;
		inp.classList.add('active');
		var smarts = document.getElementsByClassName('smartRange');
		for (let sm of smarts) { sm.classList.remove('active') }		
		document.getElementById(this.nextSibling.dataset.smart).classList.add('active');

	}, false);

	insertAfter(range, nInput);
	count++;
}

function updateValue(val, target) {
	console.log(val);
	target.value = val;
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}


for (let range of ranges) {
	updateValue(range);
	
	range.addEventListener('input', function(e) {
		updateValue(this);
	}, false);

	range.addEventListener('mousedown', function(e) {
		getValueEl(this).classList.add('active');
	}, false);

	range.addEventListener('mouseup', function(e) {
		getValueEl(this).classList.remove('active');
	}, false);
};

function getValueEl(inputEl) {
	var myID = inputEl.dataset.input;
	return(document.getElementById(myID + '-value'));
}

function updateValue(thisEl) {
	getValueEl(thisEl).innerText = thisEl.value;
}

function toggleActivity(thisEl) {
	clearActivity();
	thisEl.classList.add('active');
}

function clearActivity() {
	Array.from(sections).forEach(function(section) {
		section.classList.remove('active');
	  });
}

function expandCollapse(thisEl) {	
	var parent = thisEl.closest(".ui-section")
	parent.classList.toggle('collapsed');
}
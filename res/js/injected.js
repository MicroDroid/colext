var colored = false;
var defaultColorA = {red: 226, green: 0, blue: 0};
var defaultColorB = {red: 54, green: 0, blue: 255};
var colorA;
var colorB;

function chopText(markup) {
	var ignore = false;
	var attribute = false;
	var entity = false;
	var results = "";
	for (var i = 0, len = markup.length; i < len; i++) {
		var ch = markup.charAt(i);
		if ((ch == "<") && !attribute) {
			ignore = true;
		} else if ((ch == ">") && !attribute) {
			ignore = false;
			results = results + ch;
			continue;
		} else if (ch == "&") {
			entity = true;
			results = results + "&"
			continue;
		} else if ((ch == ";") && entity) {
			entity = false;
			results = results + ch;
			continue;	
		}

		if (ignore && (ch == "\""))
			attribute = !attribute;

		if (!ignore && !entity) {
			if (ch ==  " ")
				results = results + "</colext-span><colext-span> ";
			else
				results = results + ch;
		}
		else
			results = results + ch;
	}
	return "<colext-span>" + results + "</colext-span>";
}
function colorNodes(colorA, colorB) {
	colored = true;
	var blackColor = {red: 0, green: 0, blue: 0};
	var lastOffset = -1;
	var line = [];
	var lastEndColor = blackColor;
	var lastLastEndColor = blackColor;
	var spans = Array.prototype.slice.call(document.getElementsByTagName("colext-span"));
	spans.forEach(function(span, index) {
		var currentOffset = span.offsetTop;
		if (lastOffset == -1)
			lastOffset = currentOffset;
		if ((currentOffset - lastOffset) < 3 && (currentOffset - lastOffset) > -3)
			line.push(span);
		else {
			var colorStep = 1/line.length;
			var startColor = lastEndColor;
			var endColor = lastEndColor == blackColor ? (lastLastEndColor == colorA ? colorB : colorA) : blackColor;
			var color;
			line.forEach(function(lineSpan, index) {
				color = fadeColor(startColor, endColor, colorStep * index);
				lineSpan.style.color = "rgb(" + color.red + ", " + color.green + ", " + color.blue + ")";
			});
			line = [span];
			lastLastEndColor = lastEndColor;
			lastEndColor = endColor;
		}
		lastOffset = currentOffset;
	});
	var colorStep = 1/line.length;
	var startColor = lastEndColor;
	var endColor = lastEndColor == blackColor ? (lastLastEndColor == colorA ? colorB : colorA) : blackColor;
	var color;
	line.forEach(function(lineSpan, index) {
		color = fadeColor(startColor, endColor, colorStep * index);
		lineSpan.style.color = "rgb(" + color.red + ", " + color.green + ", " + color.blue + ")";
	});
}

function uncolorNodes() {
	colored = false;
	var spans = Array.prototype.slice.call(document.getElementsByTagName("colext-span"));
	spans.forEach(function (span, index) {
		span.style.color = "inherit";
	});
}

function fadeColor(startColor, endColor, percentFade) {
	var diffRed = endColor.red - startColor.red;
	var diffGreen = endColor.green - startColor.green;
	var diffBlue = endColor.blue - startColor.blue;

	diffRed = (diffRed * percentFade) + startColor.red;
	diffGreen = (diffGreen * percentFade) + startColor.green;
	diffBlue = (diffBlue * percentFade) + startColor.blue;

	return {red: Math.ceil(diffRed), green: Math.ceil(diffGreen), blue: Math.ceil(diffBlue)};
}

function reprocess() {
	if (!colored)
		return;
	colorNodes(colorA, colorB);
}

function init() {
	chrome.storage.local.get({
		"auto_enable": false,
		"site_rules": []
	}, function(items) {
		var site_rule;
		items.site_rules.some(function(item, index) {
			if (item.url === window.location.hostname) {
				site_rule = item;
				return true;
			}
		});
		if (site_rule) {
			if (site_rule.policy == 1) colorNodes(colorA, colorB);
		} else if (items.auto_enable) colorNodes(colorA, colorB);
	});
}

function toggleColor() {
	colored = !colored;
	if (colored)
		colorNodes(colorA, colorB);
	else
		uncolorNodes();
}

function togglePolicy() {
	var new_policy = 1;
	chrome.storage.local.get({
		"site_rules": []
	}, function(items) {
		var has_rule = false;
		items.site_rules.some(function(item, index) {
			if (item.url == window.location.hostname) {
				has_rule = true;
				items.site_rules[index].policy = new_policy = item.policy == 1 ? 2 : 1;
				return true;
			}
		});
		if (!has_rule)
			items.site_rules.push({url: window.location.hostname, policy: 1});
		chrome.storage.local.set({
			"site_rules": items.site_rules
		});
	});
	return new_policy;
}

$(function() {
	var tags = Array.prototype.slice.call(document.getElementsByTagName("p")).concat(Array.prototype.slice.call(document.getElementsByClassName("rendered_qtext")));
	tags.forEach(function(tag, index) {
		if (tag.innerText.length > 50)
			tag.innerHTML = chopText(tag.innerHTML);
	});
	chrome.storage.local.get({
		"colors": [defaultColorA, defaultColorB]
	}, function(items) {
		colorA = items.colors[0];
		colorB = items.colors[1];
	});
	init();
	$(window).resize(reprocess);
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		if (request.action === "toggleColors") {
			toggleColor();
		} else if (request.action === "togglePolicy") {
			sendResponse({policy: togglePolicy()});
		} else if (request.action === "getSiteRule") {
			var site_rule;
			chrome.storage.local.get({
				"site_rules": []
			}, function(items) {
				items.site_rules.some(function(item, index) {
					if (item.url === window.location.hostname) {
						site_rule = item;
						return true;
					}
				});
			});
		}
	});
});
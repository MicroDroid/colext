var auto_enable;
var start_color;
var end_color;
var color_test;
var defaultColorA = {red: 226, green: 0, blue: 0};
var defaultColorB = {red: 54, green: 0, blue: 255};

function restoreOptions() {
	chrome.storage.local.get({
		"auto_enable": false,
		"site_rules": [],
		"colors": [defaultColorA, defaultColorB]
	}, function(items) {
		auto_enable.prop("checked", items.auto_enable);
		start_color.jscolor.fromRGB(items.colors[0].red, items.colors[0].green, items.colors[0].blue);
		end_color.jscolor.fromRGB(items.colors[1].red, items.colors[1].green, items.colors[1].blue);
		colorNodes(color_test, items.colors[0], items.colors[1]);
		$("#rules").jsGrid({
			width: "100%",
			inserting: true,
			filtering: true,
			editing: true,
			sorting: true,
			paging: true,
			autoload: true,
			pageSize: 15,
			pageButtonCount: 5,
			confirmDeleting: false,

			data: items.site_rules,
			noDataContent: "No specified rules",
			controller: {
				insertItem: function(item) {
					chrome.storage.local.get({
						"site_rules": []
					}, function(data) {
						data.site_rules.push(item);
						chrome.storage.local.set({
							"site_rules": data.site_rules
						});
					});
				},
				updateItem: function(item) {
					chrome.storage.local.get({
						"site_rules": []
					}, function(data) {
						data.site_rules.some(function(rule, index) {
							if (rule.url == item.url) {
								data.site_rules.splice(index, 1, item);
								return true;
							}
						});
						chrome.storage.local.set({
							"site_rules": data.site_rules
						});
					});
				},
				deleteItem: function(item) {
					chrome.storage.local.get({
						"site_rules": []
					}, function(data) {
						data.site_rules.some(function(rule, index) {
							if (rule.url == item.url) {
								data.site_rules.splice(index, 1);
								return true;
							}
						});
						chrome.storage.local.set({
							"site_rules": data.site_rules
						});
					});
				},
			},

			fields: [
				{name: "url", type: "text", width: 150, title: "Base URL", editing: false, validate: "required"},
				{name: "policy", type: "select", items: [{id: 1, policy: "Always enabled"}, {id: 2, policy: "Always disabled"}], textField: "policy", valueField: "id", title: "Policy"},
				{type: "control", width: 16}
			]
		});
	});
}

function hexToRgb(hex) {
	var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	hex = hex.replace(shorthandRegex, function(m, r, g, b) {
		return r + r + g + g + b + b;
	});
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		red: parseInt(result[1], 16),
		green: parseInt(result[2], 16),
		blue: parseInt(result[3], 16)
	} : null;
}

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
			results = results + "<colext-span>&"
			continue;
		} else if ((ch == ";") && entity) {
			entity = false;
			results = results + ch + "</colext-span>";
			continue;	
		}

		if (ignore && (ch == "\""))
			attribute = !attribute;

		if (!ignore && !entity)
			results = results + "<colext-span>" + ch +  "</colext-span>";
		else
			results = results + ch;
	}
	return results;
}

function colorNodes(nodes, colorA, colorB) {
	colored = true;
	var blackColor = {red: 0, green: 0, blue: 0};
	var lastOffset = -1;
	var line = [];
	var lastEndColor = blackColor;
	var lastLastEndColor = blackColor;
	nodes.find("colext-span").addBack("colext-span").each(function (index, node) {
		var currentOffset = $(node).offset().top;
		if (lastOffset == -1)
			lastOffset = currentOffset;
		if ((currentOffset - lastOffset) < 3 && (currentOffset - lastOffset) > -3)
			line.push(node);
		else {
			var colorStep = 1/line.length;
			var startColor = lastEndColor;
			var endColor = lastEndColor == blackColor ? (lastLastEndColor == colorA ? colorB : colorA) : blackColor;
			line.forEach(function (item, index) {
				var color = fadeColor(startColor, endColor, colorStep * index);
				$(item).css("color", "rgb(" + color.red + ", " + color.green + ", " + color.blue + ")");
			});
			line = [node];
			lastLastEndColor = lastEndColor;
			lastEndColor = endColor;
		}
		lastOffset = currentOffset;
	});
	var colorStep = 1/line.length;
	var startColor = lastEndColor;
	var endColor = lastEndColor == blackColor ? (lastLastEndColor == colorA ? colorB : colorA) : blackColor;
	line.forEach(function (item, index) {
		var color = fadeColor(startColor, endColor, colorStep * index);
		$(item).css("color", "rgb(" + color.red + ", " + color.green + ", " + color.blue + ")");
	});
	return nodes;
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

function colorsChanged() {
	var colorA = hexToRgb(start_color.jscolor.valueElement.value);
	var colorB = hexToRgb(end_color.jscolor.valueElement.value)
	chrome.storage.local.set({
		"colors": [colorA, colorB]
	});
	colorNodes(color_test, colorA, colorB);
}

$(function() {
	$("[data-toggle=tooltip]").tooltip({placement: "right"});
	auto_enable = $("#auto-enable");
	start_color = $("#start-color")[0];
	end_color = $("#end-color")[0];
	color_test = $("#color-test");
	start_color.onchange = colorsChanged;
	end_color.onchange = colorsChanged;
	auto_enable.click(function() {
		chrome.storage.local.set({auto_enable: auto_enable.prop("checked")});
	});
	color_test.html(chopText(color_test.html()));
	restoreOptions();
});

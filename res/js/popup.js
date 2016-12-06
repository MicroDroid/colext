$(function() {
	var rule = $("#rule");
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		var hostname = $('<a>').prop('href', tabs[0].url).prop('hostname');
		chrome.storage.local.get({
			"site_rules": []
		}, function(items) {
			var site_rule;
			items.site_rules.some(function(item, index) {
				if (item.url === hostname) {
					site_rule = item;
					return true;
				}
			});
			if (site_rule) {
				if (site_rule.policy == 1)
					rule.css("background", "rgba(96,255,96,0.3)").html('<span class="glyphicon glyphicon-ok"></span> Always enabled');
				else
					rule.css("background", "rgba(255,96,96,0.3)").html('<span class="glyphicon glyphicon-remove"></span> Always disabled');
			}
		});
		rule.click(function() {
			chrome.storage.local.get({
				"site_rules": []
			}, function(items) {
				var new_policy = 0;
				var has_rule = false;
				items.site_rules.some(function(item, index) {
					if (item.url == hostname) {
						has_rule = true;
						items.site_rules[index].policy = new_policy = item.policy == 1 ? 2 : 1;
						return true;
					}
				});
				if (has_rule) {
					console.log("yas");
					if (new_policy == 1)
						rule.css("background", "rgba(96,255,96,0.3)").html('<span class="glyphicon glyphicon-ok"></span> Always enabled');
					else
						rule.css("background", "rgba(255,96,96,0.3)").html('<span class="glyphicon glyphicon-remove"></span> Always disabled');
				} else {
					items.site_rules.push({url: hostname, policy: 1});
					rule.css("background", "rgba(96,255,96,0.3)").html('<span class="glyphicon glyphicon-ok"></span> Always enabled');
				}
				chrome.storage.local.set({
					"site_rules": items.site_rules
				});
			});
		});
	});

	$("#color-toggle").click(function() {
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {action: "toggleColors"});
		})
	});
	$("#settings").click(function() {
		chrome.runtime.openOptionsPage()
	});
});
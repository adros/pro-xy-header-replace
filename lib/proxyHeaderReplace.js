var logger;

function init(_proxy, _logger) {
	logger = _logger;
}

function exec(config, req, res) {
	var headerReplConfig = config["pro-xy-header-replace"];
	if (!headerReplConfig || headerReplConfig.disabled) {
		logger.trace(`Header replace not enabled (${req.url})`);
		return;
	}

	var replaces = headerReplConfig.replaces;
	if (!replaces || !replaces.length) {
		logger.trace(`No replaces defined (${req.url})`);
		return;
	}

	replaces.forEach(function(replace) {
		if (!new RegExp(replace.urlPattern).test(req.url)) {
			return;
		}

		logger.trace(`Url matched "${req.url}"`);
		var regex = new RegExp(replace.pattern, "g");
		if (replace.request) {
			var headerValue = req.headers[replace.header] || "";
			if (regex.test(headerValue)) {
				var newVal = req.headers[replace.header] = headerValue.replace(regex, replace.replacement);
				logger.debug(`Value "${headerValue}" of request header "${replace.header}" replaced for "${newVal}" in ${req.url}`);
			}
		}
		if (!replace.response) {
			return;
		}
		var oldwriteHead = res.writeHead;
		res.writeHead = function() {
			var headers = this.getHeader(replace.header);
			if (typeof headers == "string") {
				headers = [
					headers
				];
			}
			this.setHeader(replace.header, (headers || []).map(function(headerValue) {
				var newVal = headerValue.replace(regex, replace.replacement);
				logger.debug(`Value "${headerValue}" of response header "${replace.header}" replaced for "${newVal}" in ${req.url}`);
				return newVal;
			}));
			oldwriteHead.apply(this, arguments);
		};
	});
}

module.exports = {
	init,
	exec
};

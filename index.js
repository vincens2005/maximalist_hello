var fetch = require("node-fetch");
var express = require("express");
var PORT = 8888;
/* this server returns whatever you put after the slash */
function setup_server() {
	var app = express();
	app.get("/:text", (req, res) => {
		let text = req.params.text;
		res.send(text);
	});
	app.listen(PORT);
}

async function print_from_server(text) {
	let response = await fetch("http://localhost:" + PORT + "/" + text).then(a => a.text());
	console.log(response);
}

async function main() {
	setup_server();
	let string_to_print = "hello world";
	await print_from_server(string_to_print);
	process.exit();
}


main();

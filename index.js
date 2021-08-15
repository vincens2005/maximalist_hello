require('dotenv').config();
var fetch = require("node-fetch");
var express = require("express");
var jsSHA = require("jssha");

var PORT = process.env.PORT || 8888;
/* this server returns whatever you put after the slash */
function setup_server() {
	var app = express();
	app.get("/:text", (req, res) => {
		let text = req.params.text;
		res.send(text);
	});
	app.listen(PORT);
}

// makes sure the hashes of the two strings are the same
function verify_hash(text, old) {
	let old_hash = new jsSHA("SHA-512", "TEXT", {encoding: "UTF8"});
	old_hash.update(old);
	old_hash = old_hash.getHash("HEX");
	
	let new_hash = new jsSHA("SHA-512", "TEXT", {encoding: "UTF8"});
	new_hash.update(text);
	new_hash = new_hash.getHash("HEX");
	
	return new_hash == old_hash;
}

async function print_from_server(text) {
	let response = await fetch("http://localhost:" + PORT + "/" + text).then(a => a.text());
	if (!verify_hash(response, text)) return console.error("ERR: hashes don't match!");
	console.log(response);
}

async function main() {
	setup_server();
	let string_to_print = "hello world";
	await print_from_server(string_to_print);
	process.exit();
}


main();

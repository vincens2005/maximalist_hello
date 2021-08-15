require('dotenv').config();
var fetch = require("node-fetch");
var express = require("express");
var jsSHA = require("jssha");
var argparse = require("argparse");
var {Random} = require("random-js");
var cows = require("cows");


var PORT = process.env.PORT || 8888;
var args = get_cli_args();
var random = new Random();

/** returns the cli args **/
function get_cli_args() {
	let parser = new argparse.ArgumentParser();
	parser.add_argument("--text", {help: "text to print"});
	parser.add_argument("-v", {dest: "verbose", action: "store_true", help: "enables verbose mode"});
	parser.add_argument("--stay-alive", {dest: "stay_alive", action: "store_true", help: "keeps the server alive after printing text"});
	parser.add_argument("-c", "--cow", {dest: "cow", action: "store_true", help: "enables cow mode"});
	return parser.parse_args();
}
/* this server returns whatever you put after the slash */
function setup_server() {
	if (args.verbose) console.log("setting up express server");
	var app = express();
	app.get("/", (req, res) => {
		if (args.verbose) console.log("got request to /");
		res.send("");
	});
	
	app.get("/:text", (req, res) => {
		let text = req.params.text;
		if (args.verbose) console.log("got request to /" + text);
		res.set("Content-Type", "text/plain");
		res.send(text);
	});
	
	if (args.verbose) console.log("app is running at http://localhost:" + PORT);
	app.listen(PORT);
}

// makes sure the hashes of the two strings are the same
function verify_hash(text, old) {
	if (args.verbose) console.log("comparing hashes of " + text + " and " + old);
	let old_hash = new jsSHA("SHA-512", "TEXT", {encoding: "UTF8"});
	old_hash.update(old);
	old_hash = old_hash.getHash("HEX");
	
	let new_hash = new jsSHA("SHA-512", "TEXT", {encoding: "UTF8"});
	new_hash.update(text);
	new_hash = new_hash.getHash("HEX");
	
	if (args.verbose) console.log("hash of old: " + old_hash + "\nhash of new: " + new_hash);
	
	return new_hash == old_hash;
}

async function print_from_server(text) {
	let texts = text.split(/\s|\t/);
	let text_to_print = "";
	if (args.cow) texts = [text];
	for (let item of texts) {
		let response = await fetch("http://localhost:" + PORT + "/" + encodeURIComponent(item)).then(a => a.text());
		if (!verify_hash(response, item)) return console.error("ERR: hashes don't match!");
		text_to_print += response + " ";
	}
	console.log(text_to_print);
}

function get_random_cow() {
	return random.pick(cows());
}

async function main() {
	if (args.verbose) console.log("running in verbose mode");
	setup_server();
	let string_to_print = args.cow ? get_random_cow() : args.text || "hello world";
	await print_from_server(string_to_print);
	if (!args.stay_alive) process.exit();
}


main();

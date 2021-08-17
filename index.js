require('dotenv').config();
var fetch = require("node-fetch");
var express = require("express");
var jsSHA = require("jssha");
var argparse = require("argparse");
var {Random} = require("random-js");
var cows = require("cows");
var isodd = require("number-isodd");
var gi = require("node-gtk");
var Gtk = gi.require("Gtk", "3.0");

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
	parser.add_argument("--window", {dest: "window", action: "store_true", help: "enables window mode"});
	return parser.parse_args();
}
/* this server returns whatever you put after the slash */
function setup_server() {
	if (args.verbose) print("setting up express server");
	var app = express();
	app.get("/", (req, res) => {
		if (args.verbose) print("got request to /");
		res.send("");
	});
	
	app.get("/:text", (req, res) => {
		let text = req.params.text;
		if (args.verbose) print("got request to /" + text);
		res.set("Content-Type", "text/plain");
		res.send(text);
	});
	
	if (args.verbose) print("app is running at http://localhost:" + PORT);
	app.listen(PORT);
}

// makes sure the hashes of the two strings are the same
function verify_hash(text, old) {
	if (args.verbose) print("comparing hashes of " + text + " and " + old);
	let old_hash = new jsSHA("SHA-512", "TEXT", {encoding: "UTF8"});
	old_hash.update(old);
	old_hash = old_hash.getHash("HEX");
	
	let new_hash = new jsSHA("SHA-512", "TEXT", {encoding: "UTF8"});
	new_hash.update(text);
	new_hash = new_hash.getHash("HEX");
	
	if (args.verbose) print("hash of old: " + old_hash + "\nhash of new: " + new_hash);
	
	return new_hash == old_hash;
}

function print(text) {
	process.stdout.write("\n");
	let chars = text.split("");
	for (let char of chars) {
		process.stdout.write(char);
	}
}

function show_text_in_window(label) {
	Gtk.init();
	if (args.verbose) print("making window");
	
	let window = new Gtk.Window();
	
	if (args.verbose) print("setting window events");
	
	window.on("destroy", () => Gtk.mainQuit());
	window.on("delete-event", () => false);
	
	if (args.verbose) print("window events set \n setting up window settings");
	
	window.setDefaultSize(200, 200);
	window.setTitle("maximalism");
	window.add(new Gtk.Label({label}));
	
	if (args.verbose) print("showing window");

	window.showAll();
	Gtk.main();
	
	if(args.verbose) print("showed " + label + " in a window");
}

async function print_from_server(text) {
	let texts = text.split(/\s|\t/);
	let text_to_print = "";
	if (args.cow) texts = [text];
	for (let item of texts) {
		let response = await fetch("http://localhost:" + PORT + "/" + encodeURIComponent(item)).then(a => a.text());
		if (!verify_hash(response, item)) return print("ERR: hashes don't match!");
		text_to_print += response + " ";
	}
	if (!args.window) return print(text_to_print);
	show_text_in_window(text_to_print);
}

function get_random_cow() {
	return random.pick(cows());
}

async function main() {
	if (args.verbose) print("running in verbose mode");
	if (args.verbose && args.cow) print("running in cow mode. text will be ignored.");
	if (isodd(PORT)) PORT++;
	if (isodd(PORT) && args.verbose) print("port is odd. adding one.");
	setup_server();
	let string_to_print = args.cow ? get_random_cow() : args.text || "hello world";
	await print_from_server(string_to_print);
	if (!args.stay_alive) process.exit();
}


main();

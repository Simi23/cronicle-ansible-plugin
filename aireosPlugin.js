#!/usr/bin/env node

const baseDir = '/opt/cronicle/bin/ansible-plugin/';

const fs = require('node:fs');
const { execSync } = require('child_process');
const JSONStream = require('pixl-json-stream');

const aireosPlaybook = require(baseDir + 'templates/aireosPlaybook.js');
const aireosInventory = require(baseDir + 'templates/aireosInventory.js');
const randomString = require(baseDir + 'randomString.js');

// Copyright (c) 2024 Tamas Simon

// config wlan <enable|disable> <wlan id>
// Params:
//   controller_ip: string
//   username: string
//   password: string
//   enable: boolean
//   wlan_id: string

const WLAN_ID_MIN = 1;
const WLAN_ID_MAX = 512;

const PYTHON = "/opt/cronicle/venv/bin/python3";

const IPV4REGEX = new RegExp('^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$');

// setup stdin / stdout streams
process.stdin.setEncoding('utf8');
process.stdout.setEncoding('utf8');

var stream = new JSONStream( process.stdin, process.stdout );
stream.on('json', async function(job) {
	// got job from parent
	var params = job.params;

	// Check if supplied controller_ip is a correct IPv4 address
	if (!IPV4REGEX.test(params.controller_ip)) {
		stream.write({ complete: 1, code: 1, description: "Supplied Controller IP is not an IPv4 address. Got: '" + (params.controller_ip) + "'" });
		return;
	}
	var controller_ip = params.controller_ip;

	// Check if wlan_id is Number
	if (isNaN(params.wlan_id)) {
		stream.write({ complete: 1, code: 1, description: "Supplied WLAN ID is not a number. Got: '" + (params.wlan_id) + "'" });
		return;
	}

	// Check if wlan_id is between 1-512
	var wlan_id = parseInt(params.wlan_id);
	if (wlan_id < WLAN_ID_MIN || wlan_id > WLAN_ID_MAX) {
		stream.write({ complete: 1, code: 1, description: "Supplied WLAN ID is not within the specified range ( " + WLAN_ID_MIN + " - " + WLAN_ID_MAX + " ). Got: " + (wlan_id) });
		return;
	}

	// Generate files for Ansible
	const jobIdentifier = randomString(8);
	const playbook = {
		fileName: baseDir + 'temp/' + jobIdentifier + '_playbook.yaml',
		content: aireosPlaybook(params.enable, wlan_id),
	};
	const inventory = {
		fileName: baseDir + 'temp/' + jobIdentifier + '_inventory.yaml',
		content: aireosInventory(controller_ip, params.username, params.password),
	};

	// Write file contents
	try {
		fs.writeFileSync(playbook.fileName, playbook.content);
		fs.writeFileSync(inventory.fileName, inventory.content);
	} catch (err) {
		stream.write({ complete: 1, code: 1, description: "Failed writing files.\n" + err});
		return;
	}

	const activateEnv = ". /opt/cronicle/venv/bin/activate"
	const command = ` -m ansible playbook -i ${inventory.fileName} ${playbook.fileName}`

	try {
		execSync(activateEnv + " && " + PYTHON + command, {stdio: [0, 2, 2]});
	} catch (err) {
		stream.write({ complete: 1, code: 1, description: "Running the task failed.\n" + err});
		return;
	}

	try {
		fs.unlinkSync(playbook.fileName);
		fs.unlinkSync(inventory.fileName);
	} catch (err) {
		stream.write({ complete: 1, code: 1, description: "Failed deleting files.\n" + err});
		return;
	}

	stream.write({ complete: 1, code: 0, description: "Successfully ran the task.\n"});
} );

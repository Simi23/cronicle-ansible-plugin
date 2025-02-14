#!/usr/bin/env node

const baseDir = '/opt/cronicle/bin/ansible-plugin/';

const fs = require('node:fs');
const { execSync } = require('child_process');
const JSONStream = require('pixl-json-stream');

const iosPlaybook = require(baseDir + 'templates/iosPlaybook.js');
const iosInventory = require(baseDir + 'templates/iosInventory.js');
const randomString = require(baseDir + 'randomString.js');

// Copyright (c) 2024 Tamas Simon

// Params:
//   ip: string
//   username: string
//   password: string
//   enable: boolean
//   interfaces: string

const PYTHON = "/opt/cronicle/venv/bin/python3";

const IPV4REGEX = new RegExp('^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$');

// setup stdin / stdout streams
process.stdin.setEncoding('utf8');
process.stdout.setEncoding('utf8');

var stream = new JSONStream( process.stdin, process.stdout );
stream.on('json', async function(job) {
	// got job from parent
	var params = job.params;

	// Check if supplied ip is a correct IPv4 address
	if (!IPV4REGEX.test(params.ip)) {
		stream.write({ complete: 1, code: 1, description: "Supplied IP is not an IPv4 address. Got: '" + (params.ip) + "'" });
		return;
	}
	var ip = params.ip;

	// Generate files for Ansible
	const jobIdentifier = randomString(8);
	const playbook = {
		fileName: baseDir + 'temp/' + jobIdentifier + '_playbook.yaml',
		content: iosPlaybook(params.enable),
	};
	const inventory = {
		fileName: baseDir + 'temp/' + jobIdentifier + '_inventory.yaml',
		content: iosInventory(ip, params.username, params.password, params.interfaces),
	};

	// Write file contents
	try {
		fs.writeFileSync(playbook.fileName, playbook.content);
		fs.writeFileSync(inventory.fileName, inventory.content);
	} catch (err) {
		stream.write({ complete: 1, code: 1, description: "Failed writing files.\n" + err});
		return;
	}

    const hostKeyCheckDisable = "export ANSIBLE_HOST_KEY_CHECKING=False";
	const activateEnv = ". /opt/cronicle/venv/bin/activate";
	const command = ` -m ansible playbook -i ${inventory.fileName} ${playbook.fileName}`;

	try {
		execSync(activateEnv + " && " + hostKeyCheckDisable + " && " + PYTHON + command, {stdio: [0, 2, 2]});
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

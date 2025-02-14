// TEMPLATE - AireOS Inventory

function aireosInventory(ip, username, password) {
	const output = `---
wlcs:
  hosts:
    wlc:
      ansible_host: ${ip}
      ansible_connection: network_cli
      ansible_network_os: aireos
      ansible_user: ${username}
      ansible_password: ${password}
      ansible_port: 22
`;
	return output;
}

module.exports = aireosInventory;

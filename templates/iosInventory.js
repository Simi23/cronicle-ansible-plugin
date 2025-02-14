// TEMPLATE - IOS Inventory

const rangeRegex = /^(?<prefix>.+?)(?<start>\d+)-(?<end>\d+)$/gm;

function aireosInventory(ip, username, password, interface) {
	let output = `---
all:
  hosts:
    switch:
      ansible_host: ${ip}
      ansible_connection: network_cli
      ansible_network_os: ios
      ansible_user: ${username}
      ansible_password: ${password}
      interfaces:`;

    if (interface.includes(',')) {
      const intList = interface.split(',').map(x => x.trim())
      for (let i = 0; i < intList.length; i++) {
        if (intList[i].includes('-')) {
          let result = rangeRegex.exec(intList[i]);
          let { prefix, start, end } = result.groups;
          start = Number(start);
          end = Number(end);
          for (let j = start; j <= end; j++) {
              const ifName = `${prefix}${j}`;
              output += `\n        - ${ifName}`;
          }
        } else {
          output += `\n        - ${intList[i]}`;
        }
      }
    } else {
      if (interface.includes('-')) {
        const result = rangeRegex.exec(interface);
        let { prefix, start, end } = result.groups;
        start = Number(start);
        end = Number(end);
        for (let i = start; i <= end; i++) {
            const ifName = `${prefix}${i}`;
            output += `\n        - ${ifName}`;
        }
      } else {
        output += `\n        - ${interface}`;
      }
    }

	return output + "\n";
}

module.exports = aireosInventory;

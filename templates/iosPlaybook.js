// TEMPLATE - IOS Playbook

function aireosPlaybook(activate) {
	const action = activate ? "true" : "false";
	const actionText = activate ? "ON" : "OFF";
	const output = `---
- name: Setting interfaces ${actionText}
  hosts: switch
  gather_facts: no
  tasks:
    - name: Setting interfaces ${actionText}
      ios_interfaces:
        config:
          - name: "{{ item }}"
            enabled: ${action}
      loop: "{{ interfaces }}"
`;
	return output;
}

module.exports = aireosPlaybook;

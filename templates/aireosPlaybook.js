// TEMPLATE - AireOS Playbook

function aireosPlaybook(activate, wlanId) {
	const action = activate ? "enable" : "disable";
	const actionText = activate ? "ON" : "OFF";
	const output = `---
- name: Setting WLAN ${wlanId} ${actionText}
  hosts: wlc
  gather_facts: no
  tasks:
    - name: Setting WLAN ${wlanId} ${actionText}
      aireos_command:
        commands:
          - "config wlan ${action} ${wlanId}"
      register: wlcresult
    - name: Show result
      debug:
        msg: "{{ wlcresult.stdout }}"
`;
	return output;
}

module.exports = aireosPlaybook;

---
title: Spurious wakes from Logitech Receiver
# link: https://wiki.archlinux.org/title/Power_management/Wakeup_triggers
date: 2026-02-20T17:26:00
tags:
  - linux
---

Since building this machine at the end of 2025, I've been having issues with it not staying asleep,
which basically means it's spent it's entire life awake. Not great for the environment (or my
electricity bill).

I checked the logs, and it doesn't seem like there's a problem. The machine is just waking up again
after about 10 seconds.

```
% journalctl -S 10m | grep -i suspend | cut -d' ' -f5-
systemd-logind[1071]: The system will suspend now!
systemd[1]: Starting NVIDIA system suspend actions...
suspend[146194]: nvidia-suspend.service
logger[146194]: <13>Feb 20 17:17:28 suspend: nvidia-suspend.service |
systemd[1]: nvidia-suspend.service: Deactivated successfully.
systemd[1]: Finished NVIDIA system suspend actions.
systemd[1]: nvidia-suspend.service: Consumed 1.896s CPU time over 2.221s wall clock time, 4.2G memory peak.
systemd[1]: Starting System Suspend...
systemd-sleep[146281]: in suspend-then-hibernate operations or setups with encrypted home directories.
systemd-sleep[146281]: Performing sleep operation 'suspend'...
kernel: PM: suspend entry (deep)
kernel: printk: Suspending console(s) (use no_console_suspend to debug)
systemd-sleep[146281]: System returned from sleep operation 'suspend'.
kernel: PM: suspend exit
systemd[1]: systemd-suspend.service: Deactivated successfully.
systemd[1]: Finished System Suspend.
systemd[1]: systemd-suspend.service: Consumed 2.372s CPU time over 7.859s wall clock time, 2.9M memory peak.
systemd[1]: Reached target Suspend.
systemd[1]: Stopped target Suspend.
systemd-logind[1071]: Operation 'suspend' finished.
suspend[146574]: nvidia-resume.service
logger[146574]: <13>Feb 20 17:17:42 suspend: nvidia-resume.service
```

I've usually found that this is caused by a Logitech Unifying Receiver waking the machine up. So I
disabled it using a `udev` rule:

```
ACTION=="add", SUBSYSTEM=="usb", ATTR{idVendor}=="046d", ATTR{idProduct}=="c548", TEST=="power/wakeup", ATTR{power/wakeup}="disabled"
```

I added this to `/etc/udev/rules.d/90-logitech-wake.rules` and then reload the rules:

```
sudo udevadm control --reload
sudo udevadm trigger
```

Running `systemctl suspend` and the machine now suspends and stays asleep. However, I cannot wake it
from sleep by pressing on the keyboard: only the power button wakes it. This is likely due to
firmware settings. I checked to see which USB bus my keyboard is on:

```
% lsusb | grep -i keyboard
Bus 001 Device 011: ID 05ac:026c Apple, Inc. Magic Keyboard with Numeric Keypad
```

I can then get the path to bus 001 using `readlink`, which will give me the path to that USB
controller.

```
% readlink -f /sys/bus/usb/devices/usb1
/sys/devices/pci0000:00/0000:00:02.1/0000:03:00.0/0000:04:0c.0/0000:0e:00.0/usb1
```

What is this, ARPANET? Anyway, now I know to look for `0000:0e:00.0` in `/proc/acpi/wakeup`:

```
% grep -i 0000:0e:00.0 /proc/acpi/wakeup
XH00	  S4	*disabled  pci:0000:0e:00.0
```

I can make sure that this hub is allowed to wake the machine by changing the `wakeup` value to
`enabled`:

```
% echo XH00 | sudo tee /proc/acpi/wakeup
enabled
% grep -i 0000:0e:00.0 /proc/acpi/wakeup
XH00	  S4	*enabled   pci:0000:0e:00.0
```

After this, I can wake the machine from sleep using the keyboard. I can make this permanent using a
systemd service:

```
# /etc/systemd/system/fix-usb-wake.service
[Unit]
Description=Fix USB Wake Configuration
After=multi-user.target

[Service]
Type=oneshot
ExecStart=/bin/sh -c 'echo XH00 > /proc/acpi/wakeup'

[Install]
WantedBy=multi-user.target
```

I then enabled and ran this service:

```
% sudo systemctl enable fix-usb-wake.service
% sudo systemctl start fix-usb-wake.service
```

This makes sure that the hub my keyboard is on is always allowed to wake the machine up.

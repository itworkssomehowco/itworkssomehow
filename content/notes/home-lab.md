---
title: "Home Lab infrastructure"
date: 2026-04-28
categories: ["Embedded"]
tags: ["Raspberry PI", "Samba", "Tailscale", "NAS"]
readtime: 15
excerpt: "One Pi 4, two disks and a stubborn refusal to pay monthly for storage I already own."
---

> The goal is one box in the corner of the room that owes nobody a subscription.

It started with photos. A lifetime of them, scattered across old phones, laptops and a drawer of CDs and DVDs, with no single place where they actually lived — and duplicates of the same photos spread across different platforms.

I already had a Raspberry Pi 4 doing nothing in particular. So the plan became a single machine at home that holds the data, is reachable from outside without opening a port, and costs nothing per month after the hardware is paid for.

This is the build log up to the point where it actually works.

## The Problem

Two requirements, and the second is the one that breaks most home NAS builds.

1. **Storage that lives here.** Big files on spinning disks I physically own.
2. **Reachable from outside.** From a laptop in a café, not just from the sofa. For quite some time this simply was not possible — until I introduced Tailscale.

There is a third requirement that is not really technical: it has to be one box. Not a NAS plus a mini PC plus a hub. One thing, one power cable.

## The Hardware

- Raspberry Pi 4, 4 GB
- Geekworm X880 — a USB 3.0 to dual SATA shield for 2.5" or 3.5" drives
- Two WD 2 TB hard drives
- Boots from an SD card
- Gigabit ethernet, wired — the Pi 4's NIC is on its own controller rather than hanging off USB like the 3B+, so wired throughput is genuinely usable
- A 3D-printed case in white ABS, designed around the stack — more on that below

A few hardware notes that cost me time.

**Do not power the disks from the Pi.** The Pi 4 budgets only around 1.2 A total across all four USB ports. Two bus-powered drives will brown out under sustained write, and the failure looks like filesystem corruption rather than a power problem, which sends you debugging the wrong layer entirely. This is the main reason for the X880 rather than two cheap enclosures: it takes its own 12 V supply and feeds both drives from it, so the Pi only carries data over USB.

**Check the RAID switch.** The X880 has hardware RAID modes. I run it with RAID off, so the Pi sees two independent disks — why that matters is in the next section. After changing the mode, confirm with `sudo fdisk -l` that both drives show up with the right capacity.

**Keep the writes off the SD card.** The system boots from an SD card, and SD cards wear out under constant writes. So the card holds only the OS — photos, shares and anything else that writes a lot live on the hard drives.

## The Case

This was the part I did not expect to enjoy, and it turned out to be the real discovery of the whole build.

Ready-made cases for the X880 exist. I made my own anyway, just because I could. I have a 3D printer, I had spare ABS lying around, and designing an enclosure from scratch was something I had never done. The whole case took 120 g of plastic.

**Measure everything first.** The Pi, the X880, both drives, the standoffs between them, the cable bends, where the ports stick out and how much room the power plug needs behind it. Calipers, a notebook, and more patience than I thought it would take. Every millimetre skipped here comes back later as a print that does not close.

**Model the hardware, not the case.** In Fusion 360 the first thing I built was not the enclosure at all — it was a model of the assembled stack itself: boards, drives, connectors, as solid bodies at their real sizes. Once that exists, the case is just a shape drawn around it with a clearance gap, and every port cutout lines up because it is projected straight off the part it is for.

**Then the box.** A shell around that model, with a bit of styling so it looks like a thing rather than a crate. Nothing elaborate — it is still essentially a box.

**Split it for access.** The shell is cut into a body and removable side covers, so the drives and the Pi can be reached without taking the whole thing apart. Cutting a finished body in Fusion is one operation; deciding *where* to cut so every piece prints well is the actual design work.

**Holes last.** Port cutouts, mounting holes and the airflow slots went in at the end, once the shape was settled. Doing them early means redoing them every time the shape changes.

<!-- PHOTO: Fusion 360 — model of the stack inside the case -->

<!-- PHOTO: the assembled box, closed -->

<!-- PHOTO: inside the box — Pi 4, X880 and the two drives -->

Two decisions about the print itself:

**ABS, not PLA.** Two hard drives that never spin down plus a Pi 4 keep the inside of a closed box warm around the clock, and PLA starts to soften at around 60 °C. ABS holds its shape well past anything this box should ever reach.

**Filter the vents.** Every airflow slot is covered from the inside with fine-mesh dust filter. A box in the corner of a room is a dust collector, and dust on spinning drives and on the Pi's board is the slow kind of failure. The trade-off is that a mesh with small holes also lets less air through — which matters later in the story.

The lesson I took from it: modelling the object first and the enclosure second is what made it work. It is the same approach as laying out a PCB around the connectors that have to line up with the outside world — and the first time it clicked that mechanical design and board design are the same kind of problem.

## Base System

Raspberry Pi OS, 64-bit, written to the SD card with Raspberry Pi Imager. The Imager's settings screen lets you set the hostname, the user and enable SSH before the first boot, so the box never needs a monitor. After that, the usual:

```bash
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y samba smartmontools
```

The Pi needs an address that does not move. Either reserve one on the router's DHCP server, or set it on the Pi. Current Raspberry Pi OS (Bookworm) manages the network with NetworkManager, so that is `nmcli`:

```bash
nmcli con show                        # find the wired connection name
sudo nmcli con mod "Wired connection 1" \
  ipv4.method manual \
  ipv4.addresses 192.168.1.10/24 \
  ipv4.gateway 192.168.1.1 \
  ipv4.dns 192.168.1.1
sudo nmcli con up "Wired connection 1"
```

Addresses are examples — use your own subnet. I prefer the DHCP reservation: the router stays the one place where addresses are decided.

One habit that matters more than any config: shut it down properly. `sudo poweroff`, wait for the activity LED to stop, then pull the power. Most of the trouble in the next sections started with a power-off that was not clean.

## Storage Layout

ext4 on both disks. Not exFAT — no journalling, no POSIX permissions, and Samba on top of it is a bad time. Not ZFS either: it wants far more RAM than a 4 GB Pi has to spare, and the whole point here is one modest box.

The two disks are not a RAID array, and they are not copies of each other. Each one has its own role and belongs to a different person: one disk, one owner, one share. Nobody's files end up mixed with anybody else's, permissions stay simple, and either disk can be unplugged and read on any machine with a USB port — which is not true of a disk pulled out of an array.

First look at what the Pi sees:

```bash
lsblk -f                   # devices, filesystems, labels, UUIDs, mountpoints
sudo fdisk -l              # sizes and partition tables
```

For a new, empty drive: one GPT partition across the whole disk, then ext4 with a label. **This wipes the disk** — check twice that `/dev/sdX` is the right one, because `sda` and `sdb` can swap places between boots.

```bash
sudo parted /dev/sdX --script mklabel gpt mkpart primary ext4 0% 100%
sudo mkfs.ext4 -L disk1 /dev/sdX1
```

That device-name shuffle is also a preview of the next section: nothing about a USB disk's name is stable except its UUID.

## The Mount Problem

The first version just let the desktop auto-mount the disks. They showed up under `/media/<user>/`, named after their filesystem labels, Samba pointed at those paths, and it worked — until the box was switched off.

After a power-off that was not clean, one share started answering every login with "permission denied". The disk was fine and the data was there. What had changed was the path. The auto-mounter had left behind an empty, root-owned stub directory with the disk's name, and on the next boot it refused to reuse that name, so it mounted the disk next to it with a `1` appended. Samba was still pointed at the original name, so it was faithfully serving an empty directory nobody was allowed into.

The root cause is that `/media/<user>/` mounts belong to a desktop session, not to the system. Samba is a daemon. It should not depend on whether someone is logged in, or on what a desktop helper decides to call a disk today.

The fix was to take mounting away from the desktop entirely and pin each disk to exactly one directory by its UUID, which never changes no matter which port it is on or what the label says:

```bash
sudo blkid                 # note the UUID of each disk
sudo mkdir -p /srv/disk1 /srv/disk2
```

Then in `/etc/fstab`:

```
UUID=<disk1-uuid>  /srv/disk1  ext4  defaults,nofail,x-systemd.device-timeout=10s  0 2
UUID=<disk2-uuid>  /srv/disk2  ext4  defaults,nofail,x-systemd.device-timeout=10s  0 2
```

Field by field: what to mount, where, which filesystem, options, a legacy `dump` flag nobody uses, and the fsck order — `2` means "check at boot, after the root filesystem".

`nofail` means a missing or dead disk does not stop the Pi from booting — you get a box without that share instead of a box that hangs at boot with no screen attached. `x-systemd.device-timeout=10s` shortens how long boot waits for an absent disk before giving up on it; the default is a minute and a half.

Before rebooting, check the file — a typo in `fstab` is one of the few ways to make a headless Pi not come back:

```bash
sudo findmnt --verify      # syntax and sanity check of /etc/fstab
sudo systemctl daemon-reload
sudo mount -a
findmnt /srv/disk1         # confirm it is mounted where it should be
```

Mount points belong to root, but the data on each disk belongs to its owner:

```bash
sudo chown -R <user1>: /srv/disk1
sudo chmod 0770 /srv/disk1
```

Since then each disk mounts into the same folder every time, Samba's `path` always points at real data, and the `1` suffix has not come back.

## Samba

Samba because everything speaks it — Windows, macOS and Linux all mount SMB shares without extra software. The important parts of `/etc/samba/smb.conf`:

```ini
[global]
   server min protocol = SMB3
   server role = standalone server
   map to guest = never

[disk1]
   path = /srv/disk1
   valid users = <user1>
   read only = no
   create mask = 0660
   directory mask = 0770

[disk2]
   path = /srv/disk2
   valid users = <user2>
   read only = no
   create mask = 0660
   directory mask = 0770
```

`server min protocol = SMB3` matters. SMB1 is ancient, broken and still enabled in plenty of default configs; if a guide tells you to lower the protocol version to fix a discovery problem, that guide is solving a 2008 problem in the wrong decade. Fix discovery with a static IP and a hostname instead.

Each share is locked to its owner with `valid users`, so one person's disk is simply not visible to the other's login.

Samba users are separate from Linux users. Each account has to exist on the system first, then be given a Samba password:

```bash
sudo adduser <user1>
sudo smbpasswd -a <user1>
```

Repeat for the second user and disk. Forgetting the `smbpasswd` step produces a login prompt that rejects the correct password forever, which is a genuinely miserable hour. `sudo pdbedit -L` lists who actually has a Samba password.

After every change to `smb.conf`:

```bash
testparm -s                          # parse the config, print the effective result
sudo systemctl restart smbd
smbclient -L //localhost -U <user1>  # list shares as that user, from the Pi itself
```

If `smbclient` on the Pi works and a client does not, the problem is the network or the client, not Samba. Mounting from the clients:

```bash
# Windows (cmd)
net use Z: \\<hostname>\disk1 /user:<user1>

# Linux
sudo mount -t cifs //<hostname>/disk1 /mnt/disk1 -o username=<user1>,vers=3.0
```

macOS: Finder → Go → Connect to Server → `smb://<hostname>/disk1`.

Over wired gigabit the ceiling is about 113 MB/s once you subtract protocol overhead. Large sequential files land near that, small files land nowhere near it — that is SMB's per-file round-trip cost, not the Pi struggling, and no amount of config tuning changes the shape of it.

## Reaching It From Outside

This is the part I expected to be hardest and it was the easiest.

No port forwarding. No dynamic DNS. No reverse proxy on a rented VPS. Tailscale builds a WireGuard mesh between my own devices, and every device gets a stable name on a private network that exists only for me. The Pi does not become reachable from the internet — it becomes reachable from *my other machines*, wherever they happen to be.

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

`tailscale up` prints a login URL; open it on any device, sign in, and the Pi joins the tailnet. The install script enables the `tailscaled` service, so it comes back on its own after a reboot. Then:

```bash
tailscale status           # every device on the tailnet and how it is connected
tailscale ip -4            # the Pi's 100.x.y.z address
tailscale ping <laptop>    # direct or via relay, and the latency
```

One setting worth changing in the admin console: disable key expiry for the Pi. By default Tailscale makes every device signed in with a user account re-authenticate every 180 days, and a headless box in the corner will not do that by itself — after about half a year it will just quietly drop off the tailnet. The fix is on the Machines page: open the Pi's menu and choose "Disable key expiry". Tagged devices are the exception — their keys do not expire by default. And if the key has already expired, `sudo tailscale up --force-reauth` on the Pi renews it.

With MagicDNS on, the Pi answers to a stable hostname from any device on the tailnet, and the SMB share mounts from a café exactly as it does from the next room — slower, but identically addressed. The personal tier covers a handful of devices at no cost, which satisfies the no-subscription rule.

One caveat worth stating plainly: this is the one piece of the stack that depends on somebody else's service. The coordination server is theirs. The data path is direct between my devices and the traffic is end-to-end encrypted, but if I am being strict about "zero cloud", this is the asterisk. Headscale is the self-hosted replacement and it is on the list, not in the build.

## Keeping an Eye on It

The disks talk SMART through the X880's USB bridge, but `smartctl` usually needs to be told to pass the commands through:

```bash
sudo smartctl -d sat -H /dev/sda     # quick health verdict
sudo smartctl -d sat -a /dev/sda     # everything: reallocated sectors, power-on hours, temperature
```

The lines worth watching are `Reallocated_Sector_Ct`, `Current_Pending_Sector` and `Offline_Uncorrectable`. Non-zero and growing means the disk is on its way out — well before it actually fails.

One thing to know about the X880: according to Geekworm's own wiki, the board has no standby function, so the drives do not spin down when idle. That is more wear and a little more heat, and it is the reason the temperature matters.

For the Pi itself:

```bash
vcgencmd measure_temp      # SoC temperature
vcgencmd get_throttled     # 0x0 means no throttling and no undervoltage, ever since boot
```

Anything other than `0x0` from `get_throttled` is worth decoding: the low bits mean it is happening now, the high bits mean it has happened since boot. Undervoltage flags in particular point straight back at the power supply.

## What's Next

Cooling, done properly. Right now the box relies on passive airflow through filtered slots, and a dust filter that keeps dirt out also keeps some of the air out. The Pi 4 starts throttling at 80 °C, and a closed printed box with two drives that never spin down is an excellent way to get there.

The plan is a 40×40 mm fan — but not one that runs flat out all day. A fan that is always on is noise and wear for no reason most of the time, and a simple on/off threshold makes it click on and off around the trip point. Instead it gets PWM speed control driven by a PID loop: it stays off while everything is cool, spins up only when the Pi or the disks heat up, and runs exactly as fast as it needs to hold the target temperature.

The inputs are already there — that is what the commands in the previous section read:

```bash
cat /sys/class/thermal/thermal_zone0/temp       # Pi SoC, in millidegrees: 52000 = 52 °C
sudo smartctl -d sat -A /dev/sda | grep -i temp # drive temperature from SMART
```

The loop takes the hotter of the two relative to its own limit, so a warm disk can turn the fan on even when the Pi is cold, and the other way round. Alongside it go temperature and humidity sensors inside the box, logged locally, so I can see what the fan is actually doing rather than guess.

That turns the box from storage into something that also measures its own environment, which is roughly where this stops being a NAS build and starts being a home lab.

## Takeaway

The interesting engineering was not the storage. Samba has been a solved problem for twenty years and ext4 does not need my opinion.

The interesting part was that "reachable from outside" and "no open ports" stopped being a contradiction the moment I stopped thinking about exposing a server to the internet and started thinking about joining my own devices to a private network. Once that flipped, remote access became a non-event — the answer was not to build a new door, it was to stop needing one.

One box. One power cable. No monthly invoice. Still holds.

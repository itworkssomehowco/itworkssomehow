---
title: "Home Lab infrastructure"
date: 2026-04-28
categories: ["Embedded"]
tags: ["Raspberry PI", "Samba", "Tailscale", "NAS", "Claude"]
readtime: 7
excerpt: "One Pi 4, two disks and a stubborn refusal to pay monthly for storage I already own."
---

> The goal is one box in the corner of the room that owes nobody a subscription.

Every cloud drive I have ever used eventually did the same thing: raised the price, changed the terms, or quietly started scanning the files. So the plan is a single machine at home that holds the data, is reachable from outside without opening a port, and costs nothing per month after the hardware is paid for.

This is the build log up to the point where it actually works.

## The Problem

Three requirements, and the third is the one that breaks most home NAS builds.

1. **Storage that lives here.** Big files on spinning disks I physically own.
2. **Reachable from outside.** From a laptop in a café, not just from the sofa.
3. **No subscriptions and no open ports.** Those usually pull in opposite directions — remote access normally means either paying someone to broker the connection, or punching a hole in the router and hoping.

There is a fourth requirement that is not really technical: it has to be one box. Not a NAS plus a mini PC plus a hub. One thing, one power cable.

## The Hardware

- Raspberry Pi 4, 4 GB
- Two USB 3.0 disks in externally powered enclosures
- Boot from USB SSD, not from an SD card
- Gigabit ethernet, wired — the Pi 4's NIC is on its own controller rather than hanging off USB like the 3B+, so wired throughput is genuinely usable
- A 3D-printed stacked case with a drive bay and airflow slots, still being designed

Two hardware notes that cost me time.

**Power the disks externally.** The Pi 4 budgets only around 1.2 A total across all four USB ports. Two bus-powered drives will brown out under sustained write, and the failure looks like filesystem corruption rather than a power problem, which sends you debugging the wrong layer entirely.

**Check the USB-SATA bridge.** Several common bridge chips advertise UAS support and then misbehave under load on the Pi, dropping the device mid-transfer. The fix is to force the older mass-storage driver for that specific device by adding a `usb-storage.quirks=VID:PID:u` entry to the kernel command line. Get the VID:PID from `lsusb`. If your enclosure is fine, skip this — but if you see devices vanishing during long copies, this is the first thing to check, not the disk.

**Do not use SD cards for the root filesystem.** A NAS writes constantly, and SD cards die from it. Boot from the SSD.

## Storage Layout

ext4 on both disks. Not exFAT — no journalling, no POSIX permissions, and Samba on top of it is a bad time. Not ZFS either: it wants far more RAM than a 4 GB Pi has to spare, and the whole point here is one modest box.

The two disks are not a RAID array. RAID is uptime insurance, not backup, and at this scale I would rather have a straightforward second copy: one disk is the working set, the other takes a scheduled `rsync`. If the working disk dies I lose whatever changed since the last sync, which is a tradeoff I can live with, and I can read the backup disk on any machine with a USB port — which is not true of a degraded array.

## Samba

Samba because everything speaks it — Windows, macOS and Linux all mount SMB shares without extra software. The important parts of `/etc/samba/smb.conf`:

```ini
[global]
   server min protocol = SMB3
   server role = standalone server
   map to guest = never

[archive]
   path = /srv/archive
   valid users = @nas
   read only = no
   force group = nas
   create mask = 0660
   directory mask = 0770
```

`server min protocol = SMB3` matters. SMB1 is ancient, broken and still enabled in plenty of default configs; if a guide tells you to lower the protocol version to fix a discovery problem, that guide is solving a 2008 problem in the wrong decade. Fix discovery with a static IP and a hostname instead.

Samba users are separate from Linux users. The account has to exist on the system first, then be given a Samba password:

```bash
sudo groupadd nas
sudo usermod -aG nas <user>
sudo smbpasswd -a <user>
```

Forgetting the second step produces a login prompt that rejects the correct password forever, which is a genuinely miserable hour.

Over wired gigabit the ceiling is about 113 MB/s once you subtract protocol overhead. Large sequential files land near that, small files land nowhere near it — that is SMB's per-file round-trip cost, not the Pi struggling, and no amount of config tuning changes the shape of it.

## Reaching It From Outside

This is the part I expected to be hardest and it was the easiest.

No port forwarding. No dynamic DNS. No reverse proxy on a rented VPS. Tailscale builds a WireGuard mesh between my own devices, and every device gets a stable name on a private network that exists only for me. The Pi does not become reachable from the internet — it becomes reachable from *my other machines*, wherever they happen to be.

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

With MagicDNS on, the Pi answers to a stable hostname from any device on the tailnet, and the SMB share mounts from a café exactly as it does from the next room — slower, but identically addressed. The personal tier covers a handful of devices at no cost, which satisfies the no-subscription rule.

One caveat worth stating plainly: this is the one piece of the stack that depends on somebody else's service. The coordination server is theirs. The data path is direct between my devices and the traffic is end-to-end encrypted, but if I am being strict about "zero cloud", this is the asterisk. Headscale is the self-hosted replacement and it is on the list, not in the build.

## The MCP Server

The other half of the box: a Model Context Protocol server, so Claude can work against files on the NAS instead of me copying things back and forth.

MCP is an open protocol for exposing tools and data to an LLM client. A server declares what it can do, the client discovers those capabilities, and the model calls them. The part that actually shaped this build is the transport.

Local MCP servers usually speak **stdio** — the client launches the server as a child process and talks to it over stdin and stdout. That is simple and secure, and it has one consequence people miss until they hit it: a stdio server has to run on the same machine as the client. Running it on the Pi and expecting a desktop client to reach it across the network does not work, because there is no network involved in stdio at all.

So there are two options. Either the server speaks HTTP and listens on the tailnet, or it stays stdio and you let SSH be the transport — the client launches it through an SSH command and the pipes get carried over the tunnel. I went with the second: no listening service, no extra auth to design, and access is already governed by the SSH keys and the tailnet.

Run it under systemd if it does listen, and let the unit handle restarts. It should also run as its own unprivileged user with access to exactly the directories it needs, which is the same principle as the Samba share — a tool that can read every path on the box is a tool that will eventually read a path you did not mean to expose.

## What's Next

Sensors. The case design has airflow slots and I want to know whether they do anything, so the next addition is temperature and humidity monitoring inside the enclosure, logged locally. The Pi 4 starts throttling at 80 °C and a sealed printed case full of spinning disks is an excellent way to get there.

That turns the box from storage into something that also measures its own environment, which is roughly where this stops being a NAS build and starts being a home lab.

## Takeaway

The interesting engineering was not the storage. Samba has been a solved problem for twenty years and ext4 does not need my opinion.

The interesting part was that "reachable from outside" and "no open ports" stopped being a contradiction the moment I stopped thinking about exposing a server to the internet and started thinking about joining my own devices to a private network. Once that flipped, remote access became a non-event, and the MCP transport question resolved the same way — the answer was not to build a new door, it was to notice I already had one.

One box. One power cable. No monthly invoice. Still holds.

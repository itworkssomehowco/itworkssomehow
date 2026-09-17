---
title: "Home Lab infrastructure"
date: 2026-04-28
categories: ["Embedded"]
tags: ["Raspberry PI", "Samba", "Claude"]
readtime: 9
excerpt: "Power budgets, antenna trace nightmares, and why your range claims are lies."
---

> The internet says you get 15 km range. The internet is wrong.

LoRa is marketed as a long-range, low-power wireless protocol. Both claims are technically true and practically misleading. This is a log of what actually happens when you build a LoRa node on an ESP32-S3 and take it outside.

## The Hardware

- ESP32-S3 (WROOM-1, 8MB flash, 8MB PSRAM)
- Semtech SX1276 via SPI
- 868 MHz antenna: wire monopole, quarter wave, tuned against the PCB ground plane
- Supply: 3.7V LiPo, 2000mAh
- Quiescent current target: <50 µA in deep sleep

## Power Budget Reality

The ESP32-S3 deep sleep current is quoted as 7 µA. What I actually measured:

- ESP32-S3 deep sleep: 22 µA
- SX1276 sleep mode: 0.2 µA  
- LDO quiescent: 55 µA (changed to a 3 µA LDO, problem solved)
- Total: ~80 µA before optimisation, ~25 µA after LDO change

At 25 µA from a 2000mAh cell, the theoretical life is 80,000 hours — over 9 years. Reality: the LiPo self-discharges at ~2% per month, which dominates over ~18 months. Still good.

The transmit current is a different story. At +20 dBm (100 mW), the SX1276 draws 120 mA. An ESP32-S3 transmitting over SPI adds another 40 mA. Call it 160 mA for 500ms per transmission cycle. At one transmission per 5 minutes, that's 267 µA average from Tx alone. Combine with sleep current and real-world battery life is about 6 months — fine for my application.

## The Antenna Trace Problem

The SX1276 RF output expects 50Ω. On a 2-layer 1.6mm FR4 board, a 50Ω microstrip is about 2.8mm wide. This trace needs to be short, straight, and isolated from digital noise.

My first layout had the SPI lines running parallel to the RF trace for 15mm. The coupling added −6 dB to my effective sensitivity. I could see the SPI clock as a spur on the spectrum analyser at 868 MHz — somehow. I still don't understand exactly how the SPI clock coupled in, but the fix (keepout area, separate the traces) worked.

## Range Claims vs. Reality

The "15 km" range figures assume:
- Line-of-sight
- SF12 (slowest, most sensitive spreading factor)
- Maximum output power (+20 dBm, requires PA_BOOST mode)
- Good antennas on both ends
- No Fresnel zone obstruction

In Warsaw at 2m antenna height, I get:
- Urban: 400–800m reliable
- Suburban: 1.5–3km
- Line of sight from a rooftop: 8km once, to a hilltop

SF12 at 125 kHz BW gives you a data rate of about 250 bps. That's enough for sensor readings. It is not enough for anything resembling real-time data.

## The Useful Config

For the ESP-NOW mesh I'm building, LoRa is actually overkill. I'm using it for the long backhaul link between the mesh gateway and a remote base station. SF9, 125 kHz, +17 dBm. Gets me 2km in the suburbs reliably, 3km on a good day. Data rate ~500 bps — enough for aggregated sensor data, nowhere near enough for video.

The mesh nodes use ESP-NOW at 2.4 GHz. The LoRa node is just the backhaul. Horses for courses.

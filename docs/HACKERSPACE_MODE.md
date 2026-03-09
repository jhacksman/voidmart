# Hackerspace Ticketing Mode (Hidden)

## Goal
Keep **Void Mart** as the default kiosk experience, but add a hidden administrative/ticketing mode for hackerspace operations.

The hidden mode should allow printing:
- **Parking permit**
- **Parking ticket** (unauthorized cruft / storage enforcement)
- **Broken stuff** ticket

This is intended to be deployed **only in the jhacksman fork** and is not planned to be upstreamed.

## Why a hidden mode?
- The kiosk should remain fun/public-facing by default.
- Staff/admin functions should not be visible or discoverable by casual users.
- A “developer options” style gesture (like Android’s "tap Build Number 7 times") is a familiar pattern.

## Unlock gesture (spec)
- Tap a secret region of the screen **10 times** within **5000ms**.
- Only works on the **landing screen**.

Region is a bottom-left square with side:
- `S = round(window.innerHeight / 16)`

So the region is:
- `x ∈ [0, S]`
- `y ∈ [window.innerHeight - S, window.innerHeight]`

## Deployment model (balena)
This project runs on a balenaOS-provisioned kiosk. balena deploys a `docker-compose.yml` release to the device.

We keep the existing container layout and add one new service:
- **redis** (local) for logging transactions/tickets without relying on a hosted Redis.

## Configuration (environment variables)
Defined in `docker-compose.yml` (can also be overridden in balena dashboard):

### Idle timeout
- `REFRESH_TIMER` (default `60000`)
  - In normal Voidmart flow: still hard reloads on idle.
  - In Mode Menu / CTRLH screens: returns to landing on idle (no hard reload).

### Local Redis logging
- `REDIS_URI` (default `redis://127.0.0.1:6379`)
- `REDIS_CONNECT_RETRY` (default `20`)

## Printing
Backend endpoint:
- `POST /ctrlh/print`
  - body: `{ kind: 'parking_permit'|'parking_ticket'|'broken_stuff', title, timestamp, note }`

## Status
Implemented:
- Landing-screen hidden unlock gesture
- Mode Menu (Voidmart / CTRLH)
- CTRLH ticket UI (3 types + optional note)
- CTRLH printing via `printer.js` without breaking existing `/printit`

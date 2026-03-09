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
- Tap a secret region of the screen **N times** within **T milliseconds**.
- Default: **10 taps within 5000ms**.

Region defaults to top-left corner, defined as fractions of screen size:
- `x0=0.0, y0=0.0`
- `x1=0.15, y1=0.15`

These are intentionally adjustable via environment variables so the gesture can be tuned without code changes.

## Deployment model (balena)
This project runs on a balenaOS-provisioned kiosk. balena deploys a `docker-compose.yml` release to the device.

We keep the existing container layout and add one new service:
- **redis** (local) for logging transactions/tickets without relying on a hosted Redis.

## Configuration (environment variables)
Defined in `docker-compose.yml` (can also be overridden in balena dashboard):

### Unlock gesture
- `SECRET_TAP_COUNT` (default `10`)
- `SECRET_TAP_WINDOW_MS` (default `5000`)
- `SECRET_TAP_REGION_X0` (default `0.0`)
- `SECRET_TAP_REGION_Y0` (default `0.0`)
- `SECRET_TAP_REGION_X1` (default `0.15`)
- `SECRET_TAP_REGION_Y1` (default `0.15`)

### Ticket mode
- `TICKET_TYPES` (default `parking_permit,parking_ticket,broken_stuff`)

### Local Redis logging
- `REDIS_URI` (default `redis://127.0.0.1:6379`)
- `REDIS_CONNECT_RETRY` (default `20`)

## Status
This doc + docker-compose changes establish the deploy-time configuration and local Redis.

The UI/router work to actually:
1) detect the tap gesture,
2) switch to a ticketing UI,
3) print the three ticket types,

is expected to be implemented next.

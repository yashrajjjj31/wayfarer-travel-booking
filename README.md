# Wayfarer Travel Booking

A responsive travel booking site with account registration and login, destination browsing and filtering, reservations, persistent user and booking records, a customer trip history, a protected admin booking endpoint, and optional SMS booking alerts.

## Run locally

Requires Node.js 18 or later. From this folder, run `npm start` and open `http://localhost:3000`. No third-party packages are required. User and booking data is stored in `data/store.json` by default.

## SMS alerts

The app uses Twilio's Messages API when credentials are present. Copy `.env.example` to `.env` and fill in `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`. The default notification destination is `+917774004950`. The server reads `.env` automatically when it starts. You need an active Twilio account and a sender enabled for sending to India. Booking requests are still saved if SMS is not configured or Twilio rejects the message; the notification status is saved with the booking.

## Saved registrations and bookings

The local data file is `data/store.json` in this project folder. It stores registered users and bookings. You can open it in Notepad or another text editor. Passwords are stored as salted hashes, never as readable passwords. Keep the file private and do not post or send it to anyone. Back it up if you need to preserve registrations. The `.gitignore` excludes both `.env` secrets and the data folder from Git.

## Admin booking view

Set a long random `ADMIN_KEY` environment variable, then request `GET /api/admin/bookings` with header `x-admin-key: <your key>`. Keep this key private. Customer accounts can read only their own records at `GET /api/bookings`.

## Hosting

GitHub stores the source code but does not run this Node backend. The included `render.yaml` is a deployment blueprint for connecting the GitHub repository to Render. It requests a persistent disk for registrations and bookings and prompts for the three Twilio values during setup. Keep those values in the hosting provider's secret settings. The in-process session store resets on restart, so use a single app instance for this starter. For a production multi-instance service, use a managed database and persistent session store.

The app needs a Node.js host in addition to its GitHub repository to have a public working URL.

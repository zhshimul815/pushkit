# WordPress.org submission checklist (G10 / G2)

Plugin source: `wordpress/pushkit-web-push/` in this repository.

Before submitting:
- [ ] Plugin tested on WordPress 5.8 → latest with PHP 7.4 and 8.x
- [ ] Settings page saves/validates; snippet appears in footer only when URL + Site ID are set
- [ ] `/pushkit-sw.js` serves the importScripts worker with `Service-Worker-Allowed: /` (check with curl after activating on a test install; permalinks must not be "Plain")
- [ ] Auto-push fires once per publish (not on updates) and is non-blocking
- [ ] readme.txt validates at https://wordpress.org/plugins/developers/readme-validator/
- [ ] Assets prepared: icon 256×256, banner 772×250 and 1544×500, screenshots (settings page, prompt on a post, PushKit dashboard)
- [ ] Plugin slug requested: `pushkit-web-push`
- [ ] SVN account ready; initial commit includes trunk + assets, tag 1.0.0

Notes:
- The plugin makes external calls only to the site owner's own PushKit install (declared in readme + settings help text) — no third-party service, no tracking. State this clearly for the review team.
- Service terms link: the plugin connects to a self-hosted instance the user operates; there is no PushKit-operated service.

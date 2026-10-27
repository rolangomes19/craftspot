# Aquiline homepage, interactive build

- `index.html`, `styles.css`, `app.js`: the page. No build step, no dependencies. Serve the folder (`python -m http.server`) and open `index.html`.
- `dist/Aquiline-homepage-interactive.html`: the same page as one self-contained file (images, CSS, JS and fonts inlined). Send this one. Rebuild with `python tools/build_single.py`.

## Tuning the motion
- Hero scroll parallax: `PARALLAX` at the top of `app.js` (photo drift, wing drift, wing rotation in degrees per pixel scrolled).
- Hero video stand-in: `push-in` keyframes in `styles.css`. When footage arrives, replace the `<img>` inside `.hero-media` with a `<video autoplay muted loop playsinline>`; the pause button, parallax and tint keep working.
- Airports: one list (`AIR` in `app.js`) drives the pins, the routes and the board rows.
- Split-flap speed: `HALF` in `app.js` (milliseconds per half flip).
- Reduced motion: the loops, parallax, staged entrances and flap spin are all switched off; content stays visible.

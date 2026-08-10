# Hero photos

Drop photos in this folder and they appear in the slider on the home page —
no code change needed. The folder is read at build time, so a new photo shows
up on the next deploy.

- **Format**: `.jpg`, `.jpeg`, `.png`, `.webp` or `.avif`
- **Size**: about 1600px on the long edge is plenty; larger files just cost
  the visitor bandwidth
- **Crop**: the desktop panel is a tall diagonal and the mobile band is 4:3,
  so keep the subject near the middle — the edges get cropped
- **Order**: slides play in file-name order. Prefix with `01-`, `02-` … to
  control the sequence.

To put the location and job line over a photo (as on the CoastPro social
creatives), add an entry to `src/data/hero-slides.ts` keyed by the exact file
name. Without an entry the photo still runs, just without a caption.

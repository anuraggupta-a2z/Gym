# Deployment Instructions

**IMPORTANT**: This project is hosted on GitHub Pages and is served from the **`gh-pages`** branch.

## How to Deploy

1.  Make your changes and commit them to `main` (or your feature branch).
2.  **Push the changes to `gh-pages` to trigger a deployment.**

```bash
# Push main to gh-pages
git push origin main:gh-pages
```

**Do NOT just push to `main` and expect the site to update.** The live site does NOT track the `main` branch.

## Verification
- Live URL: https://anuraggupta-a2z.github.io/Gym/
- Updates typically take 1-5 minutes to appear.
- If updates are stuck, check the Actions tab in GitHub repository to see if the pages build failed.

> NOTE: The old `www.a2z-ventures.com/Gym/` URL is no longer wired to this repo
> (that domain now serves a different site via Cloudflare). Use the github.io URL.

## If an installed PWA won't update or inputs stop working
The home-screen app pins its own service-worker cache. After a deploy, if the
installed app shows stale content (or iOS stops showing the keyboard on inputs),
remove it from the home screen and re-add it (Share -> Add to Home Screen). The
service worker is network-first for navigations, so a normal browser tab updates
on its own.

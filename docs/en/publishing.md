---
title: Publishing from GitHub
description: Repository and release requirements plus the moderation workflow.
locale: en
order: 6
---

# Publishing from GitHub

1. Put the source in a public GitHub repository.
2. Create a published release tagged `v<manifest.version>` or
   `<manifest.version>`.
3. Make sure the manifest and entry file exist at that tag.
4. Sign in with a verified Neuro Notes account and submit the repository, tag,
   and manifest path.
5. Review compatibility warnings and send the submission to moderation.

The marketplace reads manifest metadata through the GitHub REST API, records
the commit SHA, and never executes the entry file. An approved version is
immutable; a new version or description update goes through another review.

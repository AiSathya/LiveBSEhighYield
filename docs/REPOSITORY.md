# Source and dashboard preview

The user's public source repository is [AiSathya/LiveBSEhighYield](https://github.com/AiSathya/LiveBSEhighYield). The original LiveSGXhighYield repository is not modified.

The Manus dashboard preview is a separate deployment workspace containing the same application source. Existing GitHub repositories cannot be adopted directly as the managed preview's canonical repository, so changes are copied into the user's requested repository with a normal history-preserving commit. Daily GitHub Actions snapshots are read from the public source repository by the Android app and the dashboard's snapshot fallback.

The app must never bundle API credentials. Provider keys belong only in the backend environment and/or GitHub Actions repository Secrets.

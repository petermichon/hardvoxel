# Hardvoxel CLI and daemon

This package contains the `hardvoxel` CLI and the `hardvoxel-daemon` control plane.

See the [repository README](https://github.com/petermichon/hardvoxel) and
[ARCHITECTURE.md](https://github.com/petermichon/hardvoxel/blob/main/ARCHITECTURE.md).

## Daemon

The daemon requires Node.js 24 or newer.

```bash
node bin/hardvoxel-daemon.js \
  --state /tmp/hardvoxel/state.db \
  --api 127.0.0.1:8787 \
  --admin-socket /tmp/hardvoxel/admin.sock
```

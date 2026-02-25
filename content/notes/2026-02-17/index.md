---
title: Don't forget to set Docker log rotation
link: https://ntietz.com/blog/til-docker-log-rotation/
date: 2026-02-17T23:14:00
tags:
  - docker
---

This is a great tip. Forgetting to set up Docker log configuration is something I've done a few
times. Usually resulting in logs being lost.

Personally, I don't like to use the global `/etc/docker/daemon.json` configuration file to set log
rotation, as this effects the default logging for all containers. I tend to assume that I can expect
logs to hang around forever. When I _have_ used the global configuration, I've often ended up
finding I've lost logs that I assumed would be kept, usually several months later.

As I use [Terraform] to manage most of my infrastructure, I would typically use the [log_opts] in
the `docker_container` resource to set the log rotation options:

```hcl
resource "docker_container" "my_container" {
    # ...
    log_opts {
        max_size = "100m"
        max_file = "10"
    }
}
```

However, for a while now I've been using the `journald` logging driver, which sends the container
logs to the systemd journal. I've got into the habit of setting the configuration on a per-container
basis in Terraform, so I still don't set the log driver globally.

```hcl
resource "docker_container" "my_container" {
    # ...
    log_driver = "journald"
}
```

When the `journald` log driver is selected, logs are sent to the systemd journal, and can be
retrieved with `journalctl`. All the lovely tooling that comes with the journald logs can now be
used on the container logs.

```sh
journalctl CONTAINER_NAME=my_container
```

If I had to pick a recommendation of my own, I'd say to make sure that you're named volumes are
mounted where you think they are. I've made mistakes a few times in the past where I've mounted a
named volume to a subtly different location, and ended up losing data.

I typically check that the container has the correct volume mounts by running `docker inspect`:

```sh
docker inspect my_container --format '{{"{{"}} json .Mounts }}'
```

This will show you where the container is mounting volumes, and you can check for mounts that are
not named volumes:

```json
[
  {
    "Type": "volume",
    "Name": "cc02612de1c078708aa52e9328dfe282243a9c0ff6acce3d120a2fb7224a0357",
    "Source": "/mnt/raid0/docker/volumes/cc02612de1c078708aa52e9328dfe282243a9c0ff6acce3d120a2fb7224a0357/_data",
    "Destination": "/var/cache/searxng",
    "Driver": "local",
    "Mode": "",
    "RW": true,
    "Propagation": ""
  },
  {
    "Type": "volume",
    "Name": "searxng_data",
    "Source": "/mnt/raid0/docker/volumes/searxng_data/_data",
    "Destination": "/etc/searxng",
    "Driver": "local",
    "Mode": "z",
    "RW": true,
    "Propagation": ""
  }
]
```

I recommend also thinking about other settings you might want to configure, such as:

- Setting the container's resource limits (e.g. `memory`, `swap` and `cpu`). It can be very
  frustrating when a runaway container eats up all your resources, limiting your ability to run
  other containers or even gain access to the host.
- Ensuring mounts that do not need to be written to are read-only. This can be very important if
  you're mounting system directories like `/proc` or `/sys`, such as when you're using the
  Prometheus [node_exporter].
- Adjusting the container's capabilities (i.e. using `cap_add` and `cap_drop`). I like to use the
  principal of least privilege, and this can be a great way to limit the capabilities of a
  container: set `cap_drop` to `all` and then add the capabilities your container needs.
- Setting the container to run as a non-root user. Ideally we'd all be setting Docker to run as a
  non-root user, but I've always ran into issues with this.


[Terraform]: https://www.terraform.io/
[log_opts]: https://registry.terraform.io/providers/kreuzwerker/docker/latest/docs/resources/container#log_opts-1
[node_exporter]: https://github.com/prometheus/node_exporter?tab=readme-ov-file#docker

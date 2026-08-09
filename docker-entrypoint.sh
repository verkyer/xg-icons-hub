#!/bin/sh
set -eu

images_dir="/app/images"
default_images_dir="/app/default-images"
icon_pattern='\.(png|jpe?g|gif|svg|webp|avif)$'

if ! mkdir -p "$images_dir"; then
    echo "Error: unable to create $images_dir; check that the mount is writable." >&2
    exit 1
fi

if ! find "$images_dir" -type f | grep -Eiq "$icon_pattern"; then
    if [ ! -d "$default_images_dir" ]; then
        echo "Error: bundled icons directory $default_images_dir is missing." >&2
        exit 1
    fi

    echo "No icons found in $images_dir; initializing bundled icons."
    if ! cp -R "$default_images_dir/." "$images_dir/"; then
        echo "Error: unable to initialize $images_dir; check that the mount is writable." >&2
        exit 1
    fi
fi

exec "$@"

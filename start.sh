#!/bin/bash

if [ ! -d "data" ]; then
  mkdir data
fi

if [ -n "$(find "data" -maxdepth 0 -type d -empty 2>/dev/null)" ]; then
  deno run changelogs
fi

deno run start
#!/bin/bash

if [ ! -d "data" ]; then
  deno run changelogs
fi

deno run start
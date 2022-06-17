#!/bin/bash

# Run a couple times for variation.
# Using separate processes to avoid GDAL caching.
for i in {1..5}
do
    python doit_once.py
done

for i in {1..5}
do
    python doit_several_times.py
done

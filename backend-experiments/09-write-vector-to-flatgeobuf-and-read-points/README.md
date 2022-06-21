# Hypothesis

FlatGeobufs are billed to be a vector equivalent to cloud-optimized GeoTiffs.
So, I expect that local file access will be the fastest way to access the
vector, while using VSIGS will be mildly slower, but faster than copying the
whole file locally.  It might even be faster to use a spatial index explicitly.

# Results (not including file creation logging)

```text
+ BUCKET=natcap-urban-online-datasets
+ echo \nTiming local file accesses (base case)

Timing local file accesses (base case)
+ /usr/bin/time --portability python search-by-bounding-box.py random_global_points_NOSI.fgb
Took 0.059628963470458984 to initialize query
Finished in 4.50s
N points found in bbox: 986771
Mean lat: 0.004167, mean lon: 0.009071
real 4.78
user 4.77
sys 0.11
+ /usr/bin/time --portability python search-by-bounding-box.py random_global_points_WSI.fgb
Took 0.058133840560913086 to initialize query
Finished in 4.39s
N points found in bbox: 986771
Mean lat: 0.004167, mean lon: 0.009071
real 4.67
user 4.65
sys 0.13
+ echo \nTiming access over the network

Timing access over the network
+ /usr/bin/time --portability python search-by-bounding-box.py /vsigs/natcap-urban-online-datasets/random_global_points_NOSI.fgb
Took 5.7245988845825195 to initialize query
Finished in 20.21s
N points found in bbox: 986771
Mean lat: 0.004167, mean lon: 0.009071
real 20.67
user 7.90
sys 0.33
+ /usr/bin/time --portability python search-by-bounding-box.py /vsigs/natcap-urban-online-datasets/random_global_points_NOSI.fgb --noverify
Took 5.5050764083862305 to initialize query
Finished in 19.81s
N points found in bbox: 986771
Mean lat: 0.004167, mean lon: 0.009071
real 20.28
user 7.90
sys 0.31
+ /usr/bin/time --portability python search-by-bounding-box.py /vsigs/natcap-urban-online-datasets/random_global_points_WSI.fgb
Took 5.490539789199829 to initialize query
Finished in 19.89s
N points found in bbox: 986771
Mean lat: 0.004167, mean lon: 0.009071
real 20.36
user 7.95
sys 0.33
+ /usr/bin/time --portability python search-by-bounding-box.py /vsigs/natcap-urban-online-datasets/random_global_points_WSI.fgb --noverify
Took 5.573713541030884 to initialize query
Finished in 19.92s
N points found in bbox: 986771
Mean lat: 0.004167, mean lon: 0.009071
real 20.37
user 7.93
sys 0.26
+ echo \nTiming local file accesses (base case)

Timing local file accesses (base case)
+ /usr/bin/time --portability python search-by-bounding-box.py random_global_points_WSI.gpkg
Took 0.6439404487609863 to initialize query
Finished in 4.93s
N points found in bbox: 986771
Mean lat: 0.004167, mean lon: 0.009071
real 5.21
user 5.18
sys 0.15
+ echo \nTiming access over the network

Timing access over the network
+ /usr/bin/time --portability python search-by-bounding-box.py /vsigs/natcap-urban-online-datasets/random_global_points_WSI.gpkg
Took 129.37053728103638 to initialize query
Finished in 148.87s
N points found in bbox: 986771
Mean lat: 0.004167, mean lon: 0.009071
real 149.43
user 7.72
sys 0.70
```

## Results (formatted)

| Test | Format | Total time | Time to init query |
| ---  | ---    | ---        | ---                |
| Local file access (no spatial index)| FGB | 4.50s | 0.05963s |
| Local file access (spatial index) | FGB | 4.39s | 0.058133s |
| /vsigs/ access (no spatial index) | FGB | 20.21s | 5.72459s |
| /vsigs/ access (no spatial index) (no buffer verification) | FGB | 19.81s | 5.50507s |
| /vsigs/ access (with spatial index) | FGB | 19.89s | 5.49054s |
| /vsigs/ access (with spatial index) (no buffer verification) | FGB | 19.92s | 5.5737 |
| Local file access | GPKG | 4.93s | 0.6439s |
| /vsigs/ access | GPKG |  148.87s | 129.37053s |

Also worth noting:
```text
/usr/bin/time --portability gsutil cp gs://natcap-urban-online-datasets/random_global_points_WSI.fgb .
Copying gs://natcap-urban-online-datasets/random_global_points_WSI.fgb...
==> NOTE: You are downloading one or more large file(s), which would
run significantly faster if you enabled sliced object downloads. This
feature is enabled by default but requires that compiled crcmod be
installed (see "gsutil help crcmod").

- [1 files][ 1017 MiB/ 1017 MiB]   51.6 MiB/s
Operation completed over 1 objects/1017.2 MiB.
real 14.55
user 8.05
sys 5.40
```

Interestingly, it appears to take just about as long to complete the spatial
query over VSIGS as it does to copy the file locally and then run the query.

The time to initialize the query is about 100x faster in FGB when the FGB is
locally available than if we're using VSIGS.

Even with these slowdowns, FGB is clearly faster than GPKG, with a nominal
speedup when the GPKG is found locally, and 20x speedup when accessing the GPKG
over VSIGS.

Buffer verification does not appear to have a significant effect on access
times in this simple Point vector.  I have not yet tested this on more complex
geometries or fields.


# Conclusions

1. FlatGeoBuf appears to be a superior solution for simple layers over GPKG
   with a mild penalty (~4x on this test) for network access on a nontrivial
   spatial query.
2. For repeat file accesses where we might go to the network multiple times for
   the same information, copying the file locally might save some time.

$ ./doit.sh

Results:
```text
Download a GTIFF and read a block.
Copying gs://natcap-urban-online-datasets/nlud.tif...
==> NOTE: You are downloading one or more large file(s), which would
run significantly faster if you enabled sliced object downloads. This
feature is enabled by default but requires that compiled crcmod be
installed (see "gsutil help crcmod").

- [1 files][  1.1 GiB/  1.1 GiB]
Operation completed over 1 objects/1.1 GiB.
real 11.62
user 6.22
sys 2.51

# read block
real 0.29
user 0.34
sys 0.06

Make a VRT with VSIGS and read a block from it
0...10...20...30...40...50...60...70...80...90...100 - done.
real 0.57
user 0.13
sys 0.02

# read block
real 0.73
user 0.38
sys 0.10

Make a VRT for local GTIFF and read a block from it
0...10...20...30...40...50...60...70...80...90...100 - done.
real 0.07
user 0.06
sys 0.00

# read block
real 0.28
user 0.33
sys 0.07

Read a block from VSIGS
real 0.71
user 0.30
sys 0.14
```

So, all of these programs are reading the same block (a fairly large one).

I'm using the breakdown of 'real'/'user'/'sys' from https://stackoverflow.com/a/556411/299084.

The first test does the obviously most-expensive option: download the whole
dataset and then read the part of it we need.  Wall-clock time, download took
11.62s, reading took 0.29s.  The majority of the runtime was spent was
therefore spent in the `gsutil cp` program, but the next-biggest chunk of time
was in switching with other processes and not so much in the kernel.

The second test built a VRT using the /vsigs/ virtual filesystem.  It appears
that there's a mild cost of going to the network to build the VRT, but then
once the VRT is built the raster access is very quick.

The third test build a VRT from the previously-downloaded GTiff.  Creating the
VRT is _super_ fast compared with building the VRT in test 2, indicating that
GDAL does actually read the raster (at least a little) when creating a VRT.
Reading the VRT was (as expected) about the same speed as reading the local
file directly.  It's good to see that there isn't much overhead for reading the
raster even though there's the VRT's indirection there.

The fourth test is reading a block over the network, with no local
representation at all.  Interestingly, the speed of this is comparable to
reading the same block via the VRT approach, also with /vsigs/.  The total time
is about double the runtime than just accessing a local file.


Conclusions:

Given the convenience of a VRT and InVEST's predisposition to local files, a
VRT on a machine with a fast internet connection is a suitable alternative to
having the whole dataset available locally.

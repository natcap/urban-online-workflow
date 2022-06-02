This experiment is testing how long it takes to read a block through the GCS
virtual filesystem.

To reproduce, run `doit.sh`

Results:
```txt
Elapsed: 0.5779092311859131
Elapsed: 0.23346948623657227
Elapsed: 0.23429155349731445
Elapsed: 0.23756122589111328
Elapsed: 0.23306679725646973
Elapsed: 0.21867704391479492
Elapsed: 0.0005304813385009766
Elapsed: 0.00010204315185546875
Elapsed: 6.29425048828125e-05
Elapsed: 5.602836608886719e-05
Mean elapsed time: 0.04388570785522461
Elapsed: 0.24100828170776367
Elapsed: 0.00028705596923828125
Elapsed: 9.1552734375e-05
Elapsed: 8.416175842285156e-05
Elapsed: 5.9604644775390625e-05
Mean elapsed time: 0.04830613136291504
Elapsed: 0.23288583755493164
Elapsed: 0.0005121231079101562
Elapsed: 0.00010371208190917969
Elapsed: 6.270408630371094e-05
Elapsed: 4.506111145019531e-05
Mean elapsed time: 0.046721887588500974
Elapsed: 0.24345803260803223
Elapsed: 0.00027489662170410156
Elapsed: 9.036064147949219e-05
Elapsed: 7.05718994140625e-05
Elapsed: 5.555152893066406e-05
Mean elapsed time: 0.04878988265991211
Elapsed: 0.23971962928771973
Elapsed: 0.00034117698669433594
Elapsed: 0.00011038780212402344
Elapsed: 6.532669067382812e-05
Elapsed: 4.2438507080078125e-05
Mean elapsed time: 0.0480557918548584
```

Conclusion: GDAL does appear to be doing some block caching for us, since the
initial read is taking about 1000 times as long. That makes sense since the
network will be be expected to be WAY slower than RAM.

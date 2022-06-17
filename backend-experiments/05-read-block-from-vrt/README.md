
$ gdalbuildvrt -overwrite nlud.vrt /vsigs/natcap-urban-online-datasets/nlud.tif
$ ./doit.sh

Results:

```text
Elapsed: 0.5895638465881348
Elapsed: 0.48911476135253906
Elapsed: 0.5232257843017578
Elapsed: 0.5170035362243652
Elapsed: 0.4807567596435547
Elapsed: 0.5077404975891113
Elapsed: 0.0008697509765625
Elapsed: 0.00042128562927246094
Elapsed: 0.0003838539123535156
Elapsed: 0.00036406517028808594
Mean elapsed time: 0.10195589065551758
Elapsed: 0.49933600425720215
Elapsed: 0.0009856224060058594
Elapsed: 0.0004367828369140625
Elapsed: 0.0003879070281982422
Elapsed: 0.00039196014404296875
Mean elapsed time: 0.10030765533447265
Elapsed: 0.5293028354644775
Elapsed: 0.0007867813110351562
Elapsed: 0.0003960132598876953
Elapsed: 0.0003745555877685547
Elapsed: 0.00036454200744628906
Mean elapsed time: 0.10624494552612304
Elapsed: 0.5050039291381836
Elapsed: 0.0008502006530761719
Elapsed: 0.0004138946533203125
Elapsed: 0.00037384033203125
Elapsed: 0.000392913818359375
Mean elapsed time: 0.10140695571899414
Elapsed: 0.5747888088226318
Elapsed: 0.0007510185241699219
Elapsed: 0.00041961669921875
Elapsed: 0.0003750324249267578
Elapsed: 0.00038170814514160156
Mean elapsed time: 0.11534323692321777
```

Conclusion: there appears to be a 50% speed REDUCTION by using a VRT for this
sort of reading, even when accessing the cache.  Accesses all take about
twice the time as using /vsigs/ directly (very surprising).

This makes me think that using a VRT might be convenient for the initial raster
access (especially given InVEST's predisposition to local files), but I'm glad
we'll be using local rasters thereafter.

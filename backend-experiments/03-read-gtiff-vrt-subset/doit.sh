# I'm pulling these from invest-test-data/sdr/Input/watersheds.shp
# These are the bounding box coordinates as reprted by QGIS.
xmin=460633.4936610232107341
ymin=4927978.390259985812008
xmax=465418.5838369735865854
ymax=4932266.4547761119902134
gdalbuildvrt \
	-te $xmin $ymin $xmax $ymax \
	output.vrt /vsigs/natcap-urban-online-datasets/dem.tif

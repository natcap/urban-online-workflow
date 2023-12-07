from pathlib import Path
import logging
import tempfile
import hashlib
import inspect
from typing import List

import numpy as np
import pandas as pd

from osgeo import gdal
import pygeoprocessing

import natcap.invest.utils

pathlike = str | Path

# Global variables
TARGET_NODATA = -1


logger = logging.getLogger(__name__)
handler = logging.StreamHandler()
formatter = logging.Formatter(
    "%(asctime)s | %(levelname)s | %(threadName)s | %(name)s | %(message)s"
)
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

_EXPECTED_ENERGY_HEADERS = [
    "lucode",
    "building type",
    "kwh_per_cdd",
    "kwh_per_hdd",
    "cost_per_kwh",
]
_EXPECTED_MORTALITY_HEADERS = [
    "city",
    "t_01",
    "t_10",
    "t_mmtp",
    "t_90",
    "t_99",
    "rr_01",
    "rr_10",
    "rr_mmtp",
    "rr_90",
    "rr_99",
]


class MultiplyRasterByScalarList(object):
    """Calculate raster[idx] * scalar[idx] for each idx in the paired lists."""

    def __init__(self, category_list, scalar_list, base_nodata, category_nodata):
        """Create a closure for multiplying an array by a scalar.

        Args:
            scalar (float): value to use in `__call__` when multiplying by
                its parameter.

        Returns:
            None.
        """
        self.category_list = category_list
        self.scalar_list = scalar_list
        self.base_nodata = base_nodata
        self.category_nodata = category_nodata
        # try to get the source code of __call__ so task graph will recompute
        # if the function has changed
        try:
            self.__name__ = hashlib.sha1(
                inspect.getsource(MultiplyRasterByScalarList.__call__).encode("utf-8")
            ).hexdigest()
        except IOError:
            # default to the classname if it doesn't work
            self.__name__ = MultiplyRasterByScalarList.__name__

    def __call__(self, base_array, category_array):
        result = np.empty_like(base_array)
        result[:] = self.base_nodata

        # Create valid mask
        valid_mask = ~natcap.invest.utils.array_equals_nodata(
            base_array, self.base_nodata
        ) & ~natcap.invest.utils.array_equals_nodata(
            category_array, self.category_nodata
        )

        # Multiply masked raster by category and associated scalar
        for category, scalar in zip(self.category_list, self.scalar_list):
            # Mask by category
            current_mask = np.logical_and(valid_mask, (category_array == category))

            base_array_masked = base_array[current_mask]
            result[current_mask] = base_array_masked * scalar

        return result


def execute(args):
    """Urban Cooling Model valuation

    Args:
        args['workspace_dir'] (string): a path to the output workspace folder.
        args['city'] (string): selected city from the cities listed in args['mortality_risk_path'].
        args['lulc_tif'] (string): file path to a landcover raster.
        args['air_temp_tif'] (string): file path to an air temperature raster output from InVEST Urban Cooling Model.
        args['dd_energy_path'] (string): file path to a table indicating the relationship between LULC classes and
            energy use. Table headers must include:
                * 'lucode': column linking this table to the lulc_tif raster classes
                * 'building type': the building type associated with each raster lucode
                * 'kwh_per_cdd': the energy impact of each Cooling Degree Day for this building type
                * 'kwh_per_hdd': the energy impact of each Heating Degree Day for this building type
                * 'cost_per_hdd': the cost of energy associated with this building type
        args['mortality_risk_path'] (string): file path to a table indicating the relationship between temperature and
            mortality risk for numerous cities . Table headers must include:
                * 'city': city name in the format 'City, Country'
                * 't_01': city's 1% temperature threshold
                * 't_10': city's 10% temperature threshold
                * 't_mmtp': city's minimum-mortality temperature
                * 't_90': city's 90% temperature threshold
                * 't_99': city's 99% temperature threshold
                * 'rr_01': relative mortality risk associated with t_01
                * 'rr_10': relative mortality risk associated with t_10
                * 'rr_mmtp': relative mortality risk associated with t_mmtp (i.e. 0)
                * 'rr_90': relative mortality risk associated with t_90
                * 'rr_99': relative mortality risk associated with t_99
            This comes from Guo et al. 2014.

    Returns:
        None
    """

    dd_energy_df = pd.read_csv(args["dd_energy_path"])

    # Test for correct csv headers
    for header in _EXPECTED_ENERGY_HEADERS:
        if header not in dd_energy_df.columns:
            raise ValueError(
                f"Expected a header in biophysical table that matched the pattern '{header}' but was unable to find "
                f"one. Here are all the headers from {args['dd_energy_path']}: {list(dd_energy_df.columns)}"
            )

    # TODO Consider calculating HDD/CDD using WBGT, not just raw temp, to account for the lived experience of heat

    temp_dir = Path(args["workspace_dir"]) / "temp"
    temp_dir.mkdir(exist_ok=True)

    # Calculate Heating Degree Days raster
    logger.debug(f"Calculating Heating Degree Days")
    hdd_tif = Path(args["workspace_dir"]) / "hdd.tif"
    hdd_calculation(args["air_temp_tif"], hdd_tif)

    # Calculate energy use raster (kWh) based on Heating Degree Days
    hdd_kwh_tif = Path(args["workspace_dir"]) / "hdd_kwh.tif"
    grouped_scalar_calculation(
        hdd_tif,
        args["lulc_tif"],
        hdd_kwh_tif,
        dd_energy_df["lucode"].to_list(),
        dd_energy_df["kwh_per_hdd"].to_list(),
        temp_dir,
    )

    # Calculate energy use raster ($) based on Heating Degree Days
    hdd_cost_tif = Path(args["workspace_dir"]) / "hdd_cost.tif"
    grouped_scalar_calculation(
        hdd_kwh_tif,
        args["lulc_tif"],
        hdd_cost_tif,
        dd_energy_df["lucode"].to_list(),
        dd_energy_df["cost_per_kwh"].to_list(),
        temp_dir,
    )

    # Calculate Cooling Degree Days raster
    logger.debug("Calculating Cooling Degree Days")
    cdd_tif = Path(args["workspace_dir"]) / "cdd.tif"
    cdd_calculation(args["air_temp_tif"], cdd_tif)

    # Calculate energy use raster (kWh) based on Cooling Degree Days
    cdd_kwh_tif = Path(args["workspace_dir"]) / "cdd_kwh.tif"
    grouped_scalar_calculation(
        cdd_tif,
        args["lulc_tif"],
        cdd_kwh_tif,
        dd_energy_df["lucode"].to_list(),
        dd_energy_df["kwh_per_cdd"].to_list(),
        temp_dir,
    )

    # Calculate energy use raster ($) based on Cooling Degree Days
    cdd_cost_tif = Path(args["workspace_dir"]) / "cdd_cost.tif"
    grouped_scalar_calculation(
        cdd_kwh_tif,
        args["lulc_tif"],
        cdd_cost_tif,
        dd_energy_df["lucode"].to_list(),
        dd_energy_df["cost_per_kwh"].to_list(),
        temp_dir,
    )

    # Calculate Mortality Risk
    logger.debug("Calculating Relative Mortality Risk")

    mortality_risk_df = pd.read_csv(
        args["mortality_risk_path"], encoding="unicode_escape"
    )

    # Test for correct csv headers
    for header in _EXPECTED_MORTALITY_HEADERS:
        if header not in mortality_risk_df.columns:
            raise ValueError(
                f"Expected a header in biophysical table that matched the pattern '{header}' but was unable to find "
                f"one. Here are all the headers from {args['mortality_risk_path']}: {list(mortality_risk_df.columns)}"
            )

    # Test if selected city is in the Guo et al dataset
    if args["city"] in mortality_risk_df["city"]:
        city_mortality_risk_df = mortality_risk_df.loc[
            mortality_risk_df["city"] == args["city"]
        ]

        mortality_tif = Path(args["workspace_dir"]) / "mortality_risk.tif"
        mortality_risk_calculation(
            args["air_temp_tif"], mortality_tif, city_mortality_risk_df
        )
    else:
        logger.warning(
            f"'{args['city']}' not in Guo et al. 2014 Mortality Risk study, skipping Mortality Risk analysis."
        )


def hdd_calculation(
    t_air_raster_path: pathlike, target_hdd_path: pathlike, hdd_threshold: float = 15.5
) -> None:
    """Raster calculator op to calculate Heating Degree Days from air temperature and HDD threshold temperature.
    Implementing the following function from Roxon et al. 2020 (https://doi.org/10.1016/j.uclim.2019.100546):

        if T_(air,i) > hdd_threshold:
            hdd_i = 1.43 * 10**25 * T_(air,i) **-12.85
        else:
            hdd_i = -29.54 * T_(air,i) + 1941

    HOWEVER the problem is these are Fahrenheit Degree Day calculations, while the incoming temperature data is in
    Celsius. For now, we simply convert the incoming temperature data to Fahrenheit then convert the output
    Fahrenheit Degree Day to Celsius.


    Args:
        t_air_raster_path (pathlike): Pathlib path to T air raster.
        target_hdd_path (pathlike): Pathlib path to target hdd raster.
        hdd_threshold (float): number between 0-100.

    Returns:
        None
    """
    # Ensure path variables are Path objects
    t_air_raster_path = Path(t_air_raster_path)
    target_hdd_path = Path(target_hdd_path)

    t_air_nodata = pygeoprocessing.get_raster_info(str(t_air_raster_path))["nodata"][0]

    def hdd_op(t_air_array, hdd_val):
        hdd = np.empty(t_air_array.shape, dtype=np.float32)
        hdd[:] = TARGET_NODATA

        valid_mask = slice(None)
        if t_air_nodata is not None:
            valid_mask = ~np.isclose(t_air_array, t_air_nodata)
        t_air_valid = t_air_array[valid_mask]

        hdd[valid_mask] = np.where(
            t_air_valid > hdd_val,
            (1.43 * (10**25) * ((t_air_valid * 9 / 5 + 32) ** (-12.85))) * 5 / 9,
            ((-29.54) * (t_air_valid * 9 / 5 + 32) + 1941) * 5 / 9,
        )
        return hdd

    pygeoprocessing.raster_calculator(
        [(str(t_air_raster_path), 1), (hdd_threshold, "raw")],
        hdd_op,
        str(target_hdd_path),
        gdal.GDT_Float32,
        TARGET_NODATA,
    )


def cdd_calculation(
    t_air_raster_path: pathlike, target_cdd_path: pathlike, cdd_threshold: float = 21.1
) -> None:
    """Raster calculator op to calculate Cooling Degree Days. Currently based solely on Temperature.
    Implementing the following function from Roxon et al. 2020 (https://doi.org/10.1016/j.uclim.2019.100546):

        if T_(air,i) >= cdd_threshold:
            cdd_i = 29.58 * T_(air,i) - 1905
        else:
            cdd_i = 1.07 * 10**-18 * T_(air,i)**10.96

        HOWEVER the problem is these are Fahrenheit Degree Day calculations, while the incoming temperature data is in
        Celsius. For now, we simply convert the incoming temperature data to Fahrenheit then convert the output
        Fahrenheit Degree Day to Celsius.

    Args:
        t_air_raster_path (Path): Pathlib path to T air raster.
        target_cdd_path (Path): Pathlib path to target cdd raster.
        cdd_threshold (float): number between 0-100.

    Returns:
        None
    """
    t_air_nodata = pygeoprocessing.get_raster_info(str(t_air_raster_path))["nodata"][0]

    def cdd_op(t_air_array, cdd_val):
        cdd = np.empty(t_air_array.shape, dtype=np.float32)
        cdd[:] = TARGET_NODATA

        valid_mask = slice(None)
        if t_air_nodata is not None:
            valid_mask = ~np.isclose(t_air_array, t_air_nodata)
        t_air_valid = t_air_array[valid_mask]

        cdd[valid_mask] = np.where(
            t_air_valid >= cdd_val,
            (29.58 * (t_air_valid * 9 / 5 + 32) - 1905) * 5 / 9,
            (1.07 * (10 ** (-18)) * ((t_air_valid * 9 / 5 + 32) ** 10.96)) * 5 / 9,
        )
        return cdd

    pygeoprocessing.raster_calculator(
        [(str(t_air_raster_path), 1), (cdd_threshold, "raw")],
        cdd_op,
        str(target_cdd_path),
        gdal.GDT_Float32,
        TARGET_NODATA,
    )


def mortality_risk_calculation(
    t_air_raster_path: pathlike,
    target_mortality_path: pathlike,
    mortality_risk_df: pd.DataFrame,
) -> None:
    """Raster calculator op to calculate Relative Mortality Risk based on the following function:
    mortality = (Ti - T0) / (T0 - T1) * (R0 - R1) + R1
        where:
            Ti = T air raster
            T0 = upper temperature threshold
            T1 = lower temperature threshold
            R0 = upper mortality risk
            R1 = lower mortality risk

    Args:
        t_air_raster_path (pathlike): Path to T air raster.
        target_mortality_path (pathlike): Path to target mortality risk raster.
        mortality_risk_df (DataFrame): Pandas DataFrame with columns for the temperature thresholds and associated
            mortality risk

    Returns:
        None

    """
    # Ensure path variables are Path objects
    t_air_raster_path = Path(t_air_raster_path)
    target_mortality_path = Path(target_mortality_path)

    t_air_nodata = pygeoprocessing.get_raster_info(str(t_air_raster_path))["nodata"][0]

    def mortality_op(t_air_array):
        """
        Raster calculator op that calculates relative mortality risk based on temperature thresholds.
        mortality = (Ti - T0) / (T0 - T1) * (R0 - R1) + R1
        """
        mortality = np.empty(t_air_array.shape, dtype=np.float32)
        mortality[:] = TARGET_NODATA

        if t_air_nodata is not None:
            valid_mask = ~np.isclose(t_air_array, t_air_nodata)
        else:
            valid_mask = np.ones(t_air_array.shape, dtype=bool)

        thresholds = ["01", "10", "mmtp", "90", "99"]
        lower_thresholds = thresholds[:-1]
        # Iterate through thresholds, except 99th percentile (since we linearly interpolate anything greater than 90th)
        for i, t in enumerate(lower_thresholds[:-1]):
            # Temperature Thresholds
            lower_threshold = mortality_risk_df.loc[0, f"t_{t}"]
            upper_threshold = mortality_risk_df.loc[0, f"t_{thresholds[i+1]}"]

            # Mortality Risks
            lower_risk = mortality_risk_df.loc[0, f"rr_{t}"]
            upper_risk = mortality_risk_df.loc[0, f"rr_{thresholds[i+1]}"]

            # Calculate mask
            # Initial bin
            if i == 0:
                current_mask = np.logical_and(
                    valid_mask, (t_air_array < upper_threshold)
                )
            # Final Bin
            elif i + 1 == len(lower_thresholds):
                current_mask = np.logical_and(
                    valid_mask, (t_air_array >= lower_threshold)
                )
            # All other bins
            else:
                current_mask = np.all(
                    (
                        valid_mask,
                        (t_air_array >= lower_threshold),
                        (t_air_array < upper_threshold),
                    ),
                    axis=0,
                )

            # Actual calculation
            t_air_masked = t_air_array[current_mask]
            mortality[current_mask] = (t_air_masked - upper_threshold) / (
                lower_threshold - upper_threshold
            ) * (lower_risk - upper_risk) + upper_risk

        return mortality

    pygeoprocessing.raster_calculator(
        [(str(t_air_raster_path), 1)],
        mortality_op,
        str(target_mortality_path),
        gdal.GDT_Float32,
        TARGET_NODATA,
    )


def grouped_scalar_calculation(
    base_raster_path: pathlike,
    category_raster_path: pathlike,
    target_raster_path: pathlike,
    category_list: List[int],
    scalar_list: List[int],
) -> None:
    """Raster calculator that multiplies some base raster by scalars associated with a
    different raster's categories

    Args:
        base_raster_path (pathlike): Path to base raster to multiply
        category_raster_path (pathlike): Path to raster with categories
        target_raster_path (pathlike): Path to target raster
        category_list (List[int]): List of categories in category raster
        scalar_list (List[int]): List of scalars associated with categories

    Returns:
        None

    """
    # Ensure path variables are Path objects
    base_raster_path = Path(base_raster_path)
    category_raster_path = Path(category_raster_path)
    target_raster_path = Path(target_raster_path)

    temporary_working_dir = Path(tempfile.mkdtemp(dir=target_raster_path.parent))

    base_raster_info = pygeoprocessing.get_raster_info(str(base_raster_path))
    base_raster_nodata = base_raster_info["nodata"][0]
    cell_size = np.min(np.abs(base_raster_info["pixel_size"]))

    category_raster_nodata = pygeoprocessing.get_raster_info(str(category_raster_path))[
        "nodata"
    ][0]

    # Calculate kWh map
    grouped_scalar_op = MultiplyRasterByScalarList(
        category_list, scalar_list, base_raster_nodata, category_raster_nodata
    )

    temp_base_path = temporary_working_dir / Path(base_raster_path).name
    temp_category_path = temporary_working_dir / Path(category_raster_path).name

    pygeoprocessing.align_and_resize_raster_stack(
        [str(base_raster_path), str(category_raster_path)],
        [str(temp_base_path), str(temp_category_path)],
        ["near", "near"],
        (cell_size, -cell_size),
        "intersection",
    )

    pygeoprocessing.raster_calculator(
        [(str(temp_base_path), 1), (str(temp_category_path), 1)],
        grouped_scalar_op,
        str(target_raster_path),
        gdal.GDT_Float32,
        base_raster_nodata,
    )

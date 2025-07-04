/**
 * GeoSight is UNICEF's geospatial web-based business intelligence platform.
 *
 * Contact : geosight-no-reply@unicef.org
 *
 * .. note:: This program is free software; you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published by
 *     the Free Software Foundation; either version 3 of the License, or
 *     (at your option) any later version.
 *
 * __author__ = 'irwan@kartoza.com'
 * __date__ = '06/09/2023'
 * __copyright__ = ('Copyright 2023, Unicef')
 */

/* ==========================================================================
   Search Geometry
   ========================================================================== */

import React, { useEffect, useState } from 'react';
import $ from "jquery";
import { createFilterOptions } from "@mui/material/Autocomplete";
import { useSelector } from "react-redux";
import { InputAdornment, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CircularProgress from "@mui/material/CircularProgress";
import { axiosGet, GeorepoUrls, updateToken } from "../../../../utils/georepo";
import Autocomplete from "../../../../components/Input/Autocomplete";
import { removeLayer, removeSource } from "../../MapLibre/utils";
import { CloseIcon } from "../../../../components/Icons";
import { Session } from "../../../../utils/Sessions";

import './style.scss';
import { addLayerWithOrder } from "../../MapLibre/Render";
import { Variables } from "../../../../utils/Variables";
import { useTranslation } from 'react-i18next';

const LAYER_HIGHLIGHT_ID = 'reference-layer-highlight'

/**
 * CompareLayer component.
 */
export default function SearchGeometryInput({ map }) {

  // Limit a big list
  const filterOptions = createFilterOptions({
    ignoreCase: true,
    matchFrom: 'any',
    limit: 1000,
    stringify: (option) => option.label + ' ' + option.level_name,
  });

  const {
    enable_geometry_search
  } = useSelector(state => state.dashboard.data);
  const datasets = useSelector(state => state.globalState['datasets'])
  const referenceLayerDataState = useSelector(state => state.referenceLayerData)
  const datasetGeometries = useSelector(state => state.datasetGeometries);
  const [value, setValue] = useState(null)
  const [options, setOptions] = useState([])
  const { t } = useTranslation();

  /** Create options */
  useEffect(() => {
    const options = []
    datasets.map(dataset => {
      const referenceLayerData = referenceLayerDataState[dataset]
      const geometries = datasetGeometries[dataset]

      // Vector tile url
      const levels = referenceLayerData?.data?.dataset_levels
      if (levels && map && enable_geometry_search) {
        levels?.map(level => {
          if (geometries && geometries[level.level]) {
            for (const [concept_uuid, geometry] of Object.entries(geometries[level.level])) {
              options.push({
                id: geometry.concept_uuid,
                label: geometry.label,
                level_name: level.level_name,
                level: level.level,
                dataset: dataset
              })
            }
          } else {
            options.push({
              id: level.level,
              label: 'Loading...',
              level_name: level.level_name,
              level: level.level,
              disabled: true
            })
          }
        })
      }
    })
    setOptions(options)
  },
    [referenceLayerDataState, datasetGeometries, enable_geometry_search]
  );

  // Check all geometries are loaded
  let loaded = !!map

  const selected = (input) => {
    const $input = $('.SearchGeometryInput');
    const session = new Session('SearchGeometryInput')

    const newSelectedGeometryInput = input?.id;
    const datasetIdentifier = input?.dataset;

    // Vector tile url
    const referenceLayerData = referenceLayerDataState[datasetIdentifier]
    const vectorTiles = referenceLayerData?.data?.vector_tiles
    let vectorTileUrl = null
    if (vectorTiles && map) {
      vectorTileUrl = GeorepoUrls.WithoutDomain(updateToken(vectorTiles))
    }

    removeLayer(map, LAYER_HIGHLIGHT_ID)
    removeSource(map, LAYER_HIGHLIGHT_ID)
    if (!newSelectedGeometryInput) {
      $input.removeClass('HasData')
      $input.removeClass('Loading')
      return
    }

    $input.addClass('HasData')
    $input.addClass('Loading')
    axiosGet(preferences.georepo_api.api + `/operation/view/${datasetIdentifier}/bbox/concept_uuid/${newSelectedGeometryInput}/`)
      .then(response => response.data)
      .then(extent => {
        $input.removeClass('Loading')
        if (session.isValid && extent?.length === 4) {
          map.fitBounds([
            [extent[0], extent[1]],
            [extent[2], extent[3]]
          ],
            { padding: 20 }
          )

          // ---------- HIGHLIGHT LAYER ------------------
          removeLayer(map, LAYER_HIGHLIGHT_ID)
          removeSource(map, LAYER_HIGHLIGHT_ID)
          map.addSource(LAYER_HIGHLIGHT_ID, {
            tiles: [vectorTileUrl],
            "source-layer": 'Level-' + input.level,
            type: 'vector',
            maxzoom: 8,
          });
          addLayerWithOrder(map, {
            id: LAYER_HIGHLIGHT_ID,
            source: LAYER_HIGHLIGHT_ID,
            type: 'line',
            "source-layer": 'Level-' + input.level,
            paint: {
              'line-color': '#FF0000',
              'line-width': 10,
              'line-blur': 5
            }
          },
            Variables.LAYER_CATEGORY.HIGHTLIGHT
          )
          map.setFilter(LAYER_HIGHLIGHT_ID, ['in', 'concept_uuid'].concat([newSelectedGeometryInput]));

          setTimeout(function () {
            if (session.isValid) {
              removeLayer(map, LAYER_HIGHLIGHT_ID)
              removeSource(map, LAYER_HIGHLIGHT_ID)
            }
          }, 10000)
        }
      }).catch(err => {
        $input.removeClass('Loading')
      });
  }

  if (!enable_geometry_search) {
    return
  }

  return <div className={'SelectWithSearchInput SearchGeometryInput'}>
    <Autocomplete
      value={value}
      autoComplete={false}
      className={'SelectWithSearch SearchGeometry'}
      disableCloseOnSelect={true}
      options={options}
      disabled={!loaded}
      getOptionLabel={(option) => `${option.label} (${option.level_name})`}
      getOptionDisabled={option => option.disabled ? true : false}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={!loaded ? t("dashboardPage.searchGeographyEntityLoading") : t("dashboardPage.searchGeographyEntity")}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <InputAdornment
                position="end" className="MuiAutocomplete-endAdornment">
                <div className='CloseIcon'>
                  <CloseIcon
                    onClick={_ => {
                      setValue(null)
                      $('.SearchGeometryInput').removeClass('HasData')
                      removeLayer(map, LAYER_HIGHLIGHT_ID)
                      removeSource(map, LAYER_HIGHLIGHT_ID)
                    }}
                  />
                </div>
                <SearchIcon />
                <CircularProgress />
              </InputAdornment>
            )
          }}
        />
      )}
      onChange={(event, values) => {
        setValue(values)
        selected(values)
      }}
      renderOption={(props, option) => (
        <li {...props} aria-selected={option.id === value?.id}>
          <div
            className='SearchGeometryOption'>{option.label}<i>{option.level_name}</i>
          </div>
        </li>
      )}
      filterOptions={filterOptions}
    />

  </div>
}
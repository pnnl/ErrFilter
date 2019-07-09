
/* 
  BSD License:
  
  ErrFilter: Exploratory Error Analysis
  
  Copyright © 2019, Battelle Memorial Institute
  
  All rights reserved.
  
  1. Battelle Memorial Institute (hereinafter Battelle) hereby grants permission
     to any person or entity lawfully obtaining a copy of this software and
     associated documentation files (hereinafter “the Software”) to redistribute
     and use the Software in source and binary forms, with or without 
     modification.  Such person or entity may use, copy, modify, merge, publish,
     distribute, sublicense, and/or sell copies of the Software, and may permit
     others to do so, subject to the following conditions:
     * Redistributions of source code must retain the above copyright notice,
       this list of conditions and the following disclaimers.
     * Redistributions in binary form must reproduce the above copyright notice,
       this list of conditions and the following disclaimer in the documentation
       and/or other materials provided with the distribution.
     * Other than as used herein, neither the name Battelle Memorial Institute
       or Battelle may be used in any form whatsoever without the express
       written consent of Battelle. 
  
  2. THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
     AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
     THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
     PURPOSEARE DISCLAIMED. IN NO EVENT SHALL BATTELLE OR CONTRIBUTORS BE LIABLE
     FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
     DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
     CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
     LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
     OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
     DAMAGE.
     
*/

import {createSelector, createSelectorCreator, defaultMemoize} from 'reselect'
import {isEqual} from 'lodash'
import {Set, Map} from 'immutable'
import crossfilter from 'crossfilter2'

import {scaleLinear, scaleTime} from 'd3-scale'
import {range, extent} from 'd3-array'

import {createAction} from '.'

import {
  LOADED_DATA_PATH,
  LOADED_DATA_INDEX_PATH,
  LOADED_DATA_FEATURES_PATH,
  LOADED_DATA_COLUMNS_PATH
} from './data'

const ROOT_PATH = [...LOADED_DATA_PATH, 'crossfilter'];

export const FILTERS_PATH = [...ROOT_PATH, 'filters']
export const SORT_BY_PATH = [...ROOT_PATH, 'sortBy']
export const SORT_ASCENDING_PATH = [...ROOT_PATH, 'sortAscending']

export const getFilterDomains = createSelector(
  [ state => state.getIn(LOADED_DATA_FEATURES_PATH),
    state => state.getIn(LOADED_DATA_COLUMNS_PATH)
  ],
  (data=[], columns=[]) =>
    Map(
      columns.map((d, j) => {
        const sample = data[0][j];
        const unique = Set(data.map(d => d[j])).toArray().sort();

        if (typeof(sample) === 'string') {
          if (isNaN(new Date(sample))) {
            return [d, {
              domain: unique,
              type: 'ordinal'
            }];
          } else {

            const ticks = scaleTime()
              .domain(extent(unique.map(d => new Date(d))))
              .nice()
              .ticks();

            const scale = scaleTime()
              .domain(ticks)
              .range(range(ticks.length));

            return [d, {
              ticks, scale,
              type: 'time'
            }];
          }
        } else {

          const ticks = scaleLinear()
            .domain(extent(unique))
            .nice()
            .ticks();

          const isEvenlySpaced = unique.every((d, i, a) => i === 0 || d - a[i - 1] === a[1] - a[0]);

          if (ticks.length >= unique.length && isEvenlySpaced) {
            const scale = scaleLinear()
              .domain(unique)
              .range(range(unique.length));

            return [d, {
              ticks: unique, scale,
              type: 'linear'
            }];
          } else {
            const scale = scaleLinear()
              .domain(ticks)
              .range(range(ticks.length));

            return [d, {
              ticks, scale,
              type: 'linear'
            }];            
          }

        }
      })
    )
)

// create a "selector creator" that uses lodash.isEqual instead of ===
const createDeepEqualSelector = createSelectorCreator(
  defaultMemoize,
  isEqual
);

// use the new "selector creator" to create a selector
const getFilterNames = createDeepEqualSelector(
  state => state.getIn(FILTERS_PATH, Map()).keySeq().toArray(),
  values => values
);

const getCrossfilterDimensions = createSelector(
  [ state => state.getIn(LOADED_DATA_FEATURES_PATH),
    state => state.getIn(LOADED_DATA_COLUMNS_PATH),
    getFilterNames,
    getFilterDomains,
  ],
  (data=[], columns=[], filters=[], domains) => {
    const cf = crossfilter(range(data.length));

    const convertedData = data.map(row =>
      row.map((col, j) => domains.get(columns[j]).type === 'time' ? new Date(col) : col)
    );

    return Map(
        columns.map((d, j) =>
          [d, filters.indexOf(d) !== -1 && cf.dimension(i => convertedData[i][j])]
        )
      )
      .filter(v => v);
  }
);

export const RANGE_FILTER_MIN = '__min__';
export const RANGE_FILTER_MAX = '__max__';

export const getFilteredData = createSelector(
  [ getCrossfilterDimensions,
    getFilterDomains,
    state => state.getIn(FILTERS_PATH),
  ],
  (dimensions, domains, filters=Map()) => {
    // apply the filters (filters and dimensions should have the same domain)
    filters.forEach((v=Map(), k) => {
      if (v.size === 0) {
        // un-apply the filter, but keep the dimension
        dimensions.get(k).filterAll();
        console.log('un-filtering', k);
      } else if (v.has(RANGE_FILTER_MIN) || v.has(RANGE_FILTER_MAX)) {
        // apply range filtering
        dimensions.get(k).filterRange([v.get(RANGE_FILTER_MIN), v.get(RANGE_FILTER_MAX)]);
        console.log('range filtering', k, 'with', v.toJS());
      } else {
        // apply set filtering
        dimensions.get(k).filter(d => v.has(d));
        console.log('set filtering', k, 'with', v.keySeq().toArray());
      }
    });

    return dimensions.map((dimension, k) => {
      const {type, scale, ...rest} = domains.get(k);

      if (type === 'ordinal') {
        return {
          bins: dimension.group().all(),
          dimension, type, scale, ...rest
        };
      } else if (type === 'time') {
        return {
          bins: dimension.group(d => +scale.invert(Math.floor(scale(d)))).all(),
          dimension, type, scale, ...rest
        };
      }
      else {
        return {
          bins: dimension.group(d => scale.invert(Math.floor(scale(d)))).all(),
          dimension, type, scale, ...rest
        };
      }
    });
  }
);

export const getAllFiltered = createSelector(
  [ getFilteredData ],
  data =>
    data.size
      ? Set(data.first().dimension.top(Infinity))
      : undefined
);

export const createSetSortByAction = value =>
  createAction({setIn: [SORT_BY_PATH, value]});

export const createSetSortAscendingAction = value =>
  createAction({setIn: [SORT_ASCENDING_PATH, value]});

export const createSetFilterAction = (key, value=Map()) =>
  createAction({setIn: [[...FILTERS_PATH, key], value]});

export const createToggleFilterAction = (key, create) =>
  create
    ? createSetFilterAction(key)
    : createAction({deleteIn: [[...FILTERS_PATH, key]]});

export const createReplaceFiltersAction = value =>
  createAction({setIn: [FILTERS_PATH, value]});


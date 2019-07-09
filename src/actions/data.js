
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

import {Map, fromJS} from 'immutable'
import {get} from 'axios'

import {createAction} from '.'

import {SELECTED_ACTIVE_STEP_PATH} from './selection'

import {SELECTED_TARGET_PATH} from './selection'

const ROOT_PATH = ['data'];

export const DESCRIPTIONS_PATH = [...ROOT_PATH, 'descriptions'];
export const LOADED_DATA_NAME = [...ROOT_PATH, 'dataset'];
export const LOADED_MODEL_NAME = [...ROOT_PATH, 'model'];
export const IS_LOADING_PATH = [...ROOT_PATH, 'isLoading'];

export const LOADED_DATA_PATH = [...ROOT_PATH, 'loaded'];
export const LOADED_DATA_INDEX_PATH = [...LOADED_DATA_PATH, 'index'];
export const LOADED_DATA_FEATURES_PATH = [...LOADED_DATA_PATH, 'data'];
export const LOADED_DATA_COLUMNS_PATH = [...LOADED_DATA_PATH, 'columns'];
export const LOADED_DATA_CLUSTERS_PATH = [...LOADED_DATA_PATH, 'clusters'];
export const LOADED_DATA_PROPS_PATH = [...LOADED_DATA_PATH, 'props'];

export const createGetDescriptionsAction = () =>
  dispatch =>
    get('/api/')
      .then(result =>
        dispatch(createAction({setIn: [DESCRIPTIONS_PATH, Map(result.data)]}))
      );

export const createSelectModelAction = (dataset, model) =>
  (dispatch, getState) => {
    const state = getState();
    model = model || state.getIn([...DESCRIPTIONS_PATH, dataset], [])[0];

    dispatch(createAction(
      {deleteIn: [LOADED_DATA_PATH]},
      {setIn: [LOADED_DATA_NAME, dataset]},
      {setIn: [LOADED_MODEL_NAME, model]},
      {setIn: [IS_LOADING_PATH, true]},
    ));

    get(`/api/${dataset}/models/${model}`)
      .then(result => dispatch(createSetModelAction(result.data)));
  };

export const createSetModelAction = data => {
  console.log('got some data', data);

  const targets = data.data[0]
    .map((d, i) =>
      typeof(d) === 'string'
        ? i
        : undefined
    )
    .filter(d => d !== undefined);

  return createAction(
    {setIn: [LOADED_DATA_PATH, Map(data)]},
    {setIn: [SELECTED_TARGET_PATH, targets[0]]},
    {setIn: [IS_LOADING_PATH, false]}
  );
};

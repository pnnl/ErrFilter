
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

import React from 'react'
import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'
import {Map} from 'immutable'

import Menu from '../components/Menu'

import {getStateFromPath} from '../actions'
import {
  DESCRIPTIONS_PATH,
  LOADED_DATA_NAME,
  LOADED_MODEL_NAME,
  createSelectModelAction
} from '../actions/data'

const DatasetMenuComponent = ({dataset='', descriptions=Map(), onChange}) =>
  <Menu
    name='Data'
    value={dataset}
    options={
      descriptions
        .keySeq()
        .map(value => ({value, label: value}))
        .toArray()
    }
    onChange={value => onChange(value)}
  />

export const DatasetMenu = connect(
  state => getStateFromPath({
    descriptions: DESCRIPTIONS_PATH,
    dataset: LOADED_DATA_NAME
  }, state),
  dispatch => bindActionCreators({
    onChange: createSelectModelAction
  }, dispatch)
)(DatasetMenuComponent);

const ModelMenuComponent = ({dataset, model='', descriptions=Map(), onChange}) =>
  <Menu
    name='Model'
    value={model}
    options={descriptions.get(dataset, []).map(value => ({value, label: value}))}
    onChange={value => onChange(dataset, value)}
  />

export const ModelMenu = connect(
  state => getStateFromPath({
    descriptions: DESCRIPTIONS_PATH,
    dataset: LOADED_DATA_NAME,
    model: LOADED_MODEL_NAME
  }, state),
  dispatch => bindActionCreators({
    onChange: createSelectModelAction
  }, dispatch)
)(ModelMenuComponent);


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

import {Map} from 'immutable';

import {merge} from 'd3-array'

export const IMMUTABLE_ACTION_SEQUENCE = 'IMMUTABLE_ACTION_SEQUENCE';

export const createAction = (...args) => ({
  type: IMMUTABLE_ACTION_SEQUENCE,
  actions: [...args]
});

export const combineActions = (...args) => ({
  type: IMMUTABLE_ACTION_SEQUENCE,
  actions: merge(args.map(({actions}) => actions))
});

export const getStateFromPath = (props, state) => {
  const transformedProps = {};

  for (let k in props) {
    transformedProps[k] = state.getIn(props[k]);
  }

  return transformedProps;
};

export const setStateFromPath = (props, dispatch) => {
  const transformedProps = {};

  for (let k in props) {
    transformedProps[k] = value =>
      dispatch(createAction({setIn: [props[k], value]}));
  }

  return transformedProps;
}

export const fromPathStr = s =>
  typeof s ===  "string"
    ? s.split('.')
    : s;

export default function (state=Map(), action) {
  if (action.type === IMMUTABLE_ACTION_SEQUENCE) {

    console.log(...action.actions);

    action.actions.forEach(op => {
      for (let k in op) {
        state = state[k](...op[k]);
      }
    });

    // console.log(state.toJS());

  }

  return state;
};

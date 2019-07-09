
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
import {createSelector} from 'reselect'
import {Map} from 'immutable'

import {throttle} from 'lodash'

import {nest} from 'd3-collection'
import {color} from 'd3-color'

import Grid from 'material-ui/Grid'
import List, {ListItem, ListItemText, ListItemIcon} from 'material-ui/List';
import Typography from 'material-ui/Typography';

import {ChromePicker as ColorPicker} from 'react-color';
import SwatchPicker from '../components/SwatchPicker'

import {
  LOADED_DATA_FEATURES_PATH,
  LOADED_DATA_COLUMNS_PATH,
  LOADED_DATA_NAME,
} from '../actions/data'

import {
  COLOR_PATH,
  createSetColorAction,
  defaultColor
} from '../actions/legend'

import {
  SELECTED_TARGET_PATH
} from '../actions/selection'

import Accordion from '../components/Accordion'
import TargetSelect from './TargetSelect'

const hexColorForPicker = c => {
  const {r, g, b, opacity} = color(c);
  return {
    r: String(r),
    g: String(g),
    b: String(b),
    a: String(opacity)
  };
}

const getDescription = createSelector(
  [ state => state.getIn(LOADED_DATA_FEATURES_PATH),
    state => state.getIn(SELECTED_TARGET_PATH),
  ],
  (features=[], target) =>
    nest()
      .key(d => d[target])
      .rollup(leaves => leaves.length)
      .entries(features)
);

const Legend = ({data=[], cmap=Map(), onChange, style={}}) =>
  data.length
    ? <Grid container>
        { data.map(({key, value}) =>
            <Grid item key={key} xs={12} sm={2}>
              <ListItem component='div'>
                <ListItemIcon>
                  <SwatchPicker
                    Picker={ColorPicker}
                    onChange={throttle(c => onChange && onChange(key, c.hex), 200)}
                    color={hexColorForPicker(cmap.get(key, defaultColor(key)))}
                  />
                </ListItemIcon>

                <ListItemText primary={key} secondary={value} />
              </ListItem>
            </Grid>
          )
        }
    </Grid>
  : <div/>

export default connect(
  state => ({
    data: getDescription(state),
    cmap: state.getIn(COLOR_PATH)
  }),
  dispatch => bindActionCreators({
    onChange: createSetColorAction
  }, dispatch)
)(Legend)


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

import React, {Component} from 'react'
import {createSelector} from 'reselect'

import {throttle} from 'lodash'

import {extent, max, histogram} from 'd3-array'

import {
  FlexibleWidthXYPlot,
  VerticalBarSeries as Series,
  LineSeries
} from 'react-vis'

import 'react-vis/dist/style.css'

const computeKDE = createSelector(
  [ props => props.data,
    props => props.xDomain,
    props => props.bins,
  ],
  (data, domain, bins=30) => {
    const points = histogram()
      .thresholds(bins)
      .domain(domain || extent(data))(
        data
      );

    return points.map(d => ({x: d.x0, y: d.length}));
  }
)

class Histogram extends Component {
  state = {}

  handleChange = throttle(() => {
    const {onChange} = this.props;
    const {threshold} = this.state;

    onChange && onChange(threshold);
  }, 100)

  handleNearestX = ({x, y}, ev) => {
    if (ev.event.buttons === 1) {
      this.setState({threshold: x});
      this.handleChange();
    }
  }

  handleClick = ({x}) => {
    this.setState({threshold: x});
    this.handleChange();
  }

  componentWillReceiveProps(nextProps) {
    this.handleChange.cancel();
  }

  render() {
    const {data, children, side=1, ...rest} = this.props;

    const {threshold} = this.state;

    const points = computeKDE(this.props);

    return (
      <FlexibleWidthXYPlot {...rest}>
        { data.length &&
          <Series
            key='full'
            style={{stroke: 'black'}}
            colorType='literal'
            data={points.map(({x, y}) =>({
              x, y,
              color: side*(x - threshold) > 0 ? 'white' : 'black '})
            )}
            curve='curveStep'
            onNearestX={this.handleNearestX}
            onValueClick={this.handleClick}
          />
        }

        { threshold &&
          <LineSeries
            key='mark'
            data={[
              {x: threshold, y: 0},
              {x: threshold, y: max(points, d => d.y)}
            ]}
          />
        }

        {children}

      </FlexibleWidthXYPlot>
    );
  }
}

export default Histogram

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
import {Map} from 'immutable'

import Typography from 'material-ui/Typography'
import IconButton from 'material-ui/IconButton'
import CloseIcon from 'material-ui-icons/Close'
import Button from 'material-ui/Button'
import Card, { CardHeader, CardContent, CardActions } from 'material-ui/Card'

import {
  RadialChart,
  Hint,
  LabelSeries
} from 'react-vis'

import 'react-vis/dist/style.css'

import IconContainer from '../containers/Icons'

import './NodeDetail.css'

import {defaultColor} from '../actions/legend'

class NodeDetail extends Component {
  state = {
    value: false
  }

  render() {
    const {
      data=Map(),
      colors=Map(),
      title,
      width=100,
      thickness=20,
      onClick,
      onClose,
      className='',
      numExamples=1,
      style
    } = this.props;

    const {value} = this.state;

    const radialChartData = data
      .map((v, k) => ({
        angle: v.size,
        count: v.size,
        color: colors.get(k, defaultColor(k)),
        label: k
      }))
      .toArray();

    const totalItems = data.reduce((sum, x) => sum + x.size, 0);

    const examples = data.map(v =>
      v.keySeq().slice(0, Math.ceil(numExamples*v.size/totalItems))
    );

    return (
      <Card className={`node-detail ${className}`} style={style}>
        <CardHeader
          title={title}
          action={
            onClose &&
            <IconButton aria-label='Close' onClick={onClose}>
              <CloseIcon />
            </IconButton>
          }
        />

        <CardContent>
          <RadialChart
            width={width} height={width}
            data={radialChartData}
            radius={width/2}
            innerRadius={width/2-thickness}
            colorType='literal'
            onValueMouseOver={v => this.setState({value: v})}
            onSeriesMouseOut={v => this.setState({value: false})}
          >
            <LabelSeries
              className='inside-donut'
              data={[{x: 0, y: 0, label: String(totalItems)}]}
            />

            { value &&
              <Hint
                value={value}
                format={({label, count}) =>
                  [{title: label, value: count}]
                }
              />
            }
          </RadialChart>
        </CardContent>

        { examples
            .entrySeq().map(([k, v]) =>
              <span key={k}>
                { v.map(i => 
                    <IconContainer
                      key={i}
                      index={i}
                      height={75} width={75}
                      style={{borderTop: `4px solid ${colors.get(k, defaultColor(k))}`, paddingTop: 4, borderRadius: 4}}
                    />
                  )
                }
              </span>
            )
        }

        { onClick &&
          <CardActions>
            <Button dense color='primary' onClick={onClick}>
              Set as focus
            </Button>
          </CardActions>
        }
      </Card>
    );    
  }
}

export default NodeDetail

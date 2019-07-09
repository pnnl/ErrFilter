
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
import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'
import {Map} from 'immutable'

import {throttle} from 'lodash'

import {scaleLinear, scaleLog} from 'd3-scale'
import {sum, merge, max, extent} from 'd3-array'
import {axisBottom, axisLeft} from 'd3-axis'
import {format} from 'd3-format'
import {area} from 'd3-shape'
import {event as currentEvent, select} from 'd3-selection'
import {brushX} from 'd3-brush'
import {
  timeSecond,
  timeMinute,
  timeHour,
  timeDay,
  timeWeek,
  timeMonth,
  timeYear
} from 'd3-time'
import {timeFormat} from 'd3-time-format'

import Select from 'react-select'
import 'react-select/dist/react-select.css'

import Grid from 'material-ui/Grid'
import List, {ListItem, ListItemText, ListItemIcon} from 'material-ui/List'
import Typography from 'material-ui/Typography'
import Checkbox from 'material-ui/Checkbox'
import Card, { CardHeader } from 'material-ui/Card'
import IconButton from 'material-ui/IconButton'
import Paper from 'material-ui/Paper'
import ExpansionPanel, {
  ExpansionPanelSummary,
  ExpansionPanelDetails,
} from 'material-ui/ExpansionPanel'

import ExpandMoreIcon from 'material-ui-icons/ExpandMore'
import CloseIcon from 'material-ui-icons/Close'

import {
  FlexibleWidthXYPlot,
  XAxis,
  YAxis,
  VerticalGridLines,
  HorizontalGridLines,
  VerticalBarSeries,
  LineMarkSeries,
} from 'react-vis';

import {getStateFromPath} from '../actions'

import {
  COLOR_PATH,
  defaultColor
} from '../actions/legend'

import {
  LOADED_DATA_FEATURES_PATH,
  LOADED_DATA_COLUMNS_PATH
} from '../actions/data'

import {
  getFilteredData,
  getFilterDomains,
  createSetFilterAction,
  createToggleFilterAction,
  createReplaceFiltersAction,
  FILTERS_PATH,
  RANGE_FILTER_MIN,
  RANGE_FILTER_MAX,
} from '../actions/crossfilter'

import Icon from './Icons'

import ReactD3Chart from '../components/ReactD3Chart'

const formatSI = format('.2s');

const formatCount = d => d >= 1000 ? formatSI(d) : String(d);

const formatMillisecond = timeFormat(".%L"),
      formatSecond = timeFormat(":%S"),
      formatMinute = timeFormat("%I:%M"),
      formatHour = timeFormat("%I %p"),
      formatDay = timeFormat("%a %d"),
      formatWeek = timeFormat("%b %d"),
      formatMonth = timeFormat("%b"),
      formatYear = timeFormat("%Y");

function getMultiFormat(date) {
  return (timeSecond(date) < date ? formatMillisecond
      : timeMinute(date) < date ? formatSecond
      : timeHour(date) < date ? formatMinute
      : timeDay(date) < date ? formatHour
      : timeMonth(date) < date ? (timeWeek(date) < date ? formatDay : formatWeek)
      : timeYear(date) < date ? formatMonth
      : formatYear);
}

function multiFormat(date) {
  return getMultiFormat(date)(date);
}

const ReactD3Histogram = ({spacing=3, xAxis, yAxis, scale, ...props}) =>
  <ReactD3Chart
    {...props}
    margin={{
      left: yAxis ? 30 : (xAxis ? 10 : 2),
      right: xAxis ? 10 : 2,
      bottom: xAxis ? 30 : 2,
      top: yAxis ? 10 : 2
    }}
    init={({data, ticks, width, height}) => {
      if (data.length === 0) {
        return {layers: []};
      } else {
        const barWidth = (width - (ticks.length + 1)*spacing)/ticks.length;

        const x = scaleLinear()
          .domain(extent(ticks))
          .range([spacing, width - spacing - barWidth]);

        const y = scaleLinear()
          .domain([0, max(data, d => d.value)])
          .range([0, -height]);

        return {x, y, barWidth};
      }
    }}
    layers={[
      {
        name: 'areas',
        callback: (selection, {data=[], x, y, color, barWidth}) => {
          const paths = selection
            .style('fill', color)
            .selectAll('path')
              .data([data]);

          paths.enter()
            .append('path')
            .merge(paths)
              .transition()
              .duration(500)
                .attr('d', d => {
                  const points = d.map(({key, value}) => [
                    [x(key), y(0)],
                    [x(key), y(value)],
                    [x(key) + barWidth, y(value)],
                    [x(key) + barWidth, y(0)],
                  ]);

                  return area()(merge(points));
                });

          paths.exit()
            .remove();
        }
      },
      {
        name: 'bar-text',
        callback: (selection, {data, x, y, margin, areas, barWidth, color}) => {
          const dy = 4;
          const th = 16;

          const isHanging = value => Math.abs(y(value) - y(0)) > th + dy

          const bar = selection
            .style('font-weight', 'bold')
            .style('font-size', th)
            .attr('text-anchor', 'middle')
            .selectAll('text')
              .data(data);
            
          bar.enter()
            .append('text')
              .attr('x', ({key}) => x(key) + barWidth/2)
              .attr('y', y(0))
              .merge(bar)
                .transition()
                .duration(500)
                  .attr('dy', ({value}) => isHanging(value) ? th + dy : -dy)
                  .attr('x', ({key}) => x(key) + barWidth/2)
                  .attr('y', ({value}) => y(value))
                  .style('fill', ({value}) => isHanging(value) ? 'white' : color)
                  .text(({value}) => value > 0 ? formatCount(value) : null);

          bar.exit()
            .remove();
        }
      },
      {
        name: 'axis axis--x',
        callback: (selection, {ticks, x, type}) => {
          if (xAxis) {
            const axis = axisBottom(x)
              .tickValues(ticks);

            if (type === 'time') {
              axis.tickFormat(multiFormat);
            }

            selection.call(axis);
          }
        }
      },
      {
        name: 'axis axis--y',
        callback: (selection, {y}) => 
          yAxis && selection.call(axisLeft(y))
      },
      {
        name: 'brush',
        callback: (selection, {x, extent, margin={}, height, width, onChange, color, barWidth}) => {

          const {top=0} = margin;

          const brush = brushX()
            .handleSize(10)
            .extent([[0, -top - height],[width, 0]]);

          const handleChange = throttle(extent => onChange && onChange(extent), 500);

          function handleBrush() {
            const {type} = currentEvent.sourceEvent || {};

            if (type && type !== 'brush' && type !== 'end') {
              handleChange(currentEvent.selection ? currentEvent.selection.map(x.invert) : null);
            }
          }

          function handleBrushEnd() {
            const {type} = currentEvent.sourceEvent || {};

            if (!currentEvent.selection) {
              return handleChange();
            }

            const [xmin, xmax] = currentEvent.selection.map(x.invert);

            const xminSnapped = scale.invert(Math.floor(scale(xmin)));
            const xmaxSnapped = scale.invert(Math.floor(scale(xmax)) + 1 - 1e-6);

            if (type === undefined) {
              // this should be for the brush animation only
              handleChange([xminSnapped, xmaxSnapped]);
            } else if (type && type !== 'brush' && type !== 'end') {
              // this should be when the user ends the brush
              if (currentEvent.selection) {

                // cancel the trottle so that it doesn't happen during animation
                handleChange.cancel();

                select(this)
                  .transition()
                    .duration(250)
                    .call(brush.move, [xminSnapped, xmaxSnapped].map(x));
              }
            }
          }

          selection
              .call(brush)
              .call(brush.move, extent ? extent.map(x) : null)
            // .select('rect.selection')
            //   .style('fill', color)
            //   .style('cursor', 'default');

          // add these callbacks after we programmattically set the brush
          // prevents infinite rendering loop
          brush
            .on('brush', handleBrush)
            .on('end', handleBrushEnd);
        }
      }
    ]}
  />

const LinearHistogram = ({name, bins=[], ticks=[], filter=Map(), onChange, ...props}) => {

  const xmin = filter.get(RANGE_FILTER_MIN);
  const xmax = filter.get(RANGE_FILTER_MAX);

  const handleBrush = extent => {
    if (extent) {
      // emit the brush event
      const [xmin, xmax] = extent;

      onChange(name, Map({
        [RANGE_FILTER_MIN]: xmin,
        [RANGE_FILTER_MAX]: xmax
      }));
    } else {
      // clear the filter
      onChange(name);
    }

  }

  return <ReactD3Histogram
    xAxis
    color='teal'
    data={bins}
    ticks={ticks}
    onChange={handleBrush}
    extent={[xmin, xmax]}
    style={{width: '100%'}}
    {...props}
  />
}

const OrdinalHistogram = ({size, name, bins=[], filter=Map(), domain, onChange, cmap=Map(), log=true, rescale=false, ...props}) => {
  const data = bins.map(({key, value}) => ({
    x: key,
    y: value,
    fill: filter.size === 0 || filter.has(key)
      ? cmap.get(key, defaultColor(key))
      : 'white',
    stroke: cmap.get(key, defaultColor(key)),
  }));

  return (
    <FlexibleWidthXYPlot
      xDomain={domain}
      yType={log ? 'log' : 'linear'}
      yDomain={rescale ? null : [1, size]}
      xType='ordinal'
      strokeType='literal'
      fillType='literal'
      onDoubleClick={() => onChange(name)}
      {...props}
    >
      <VerticalGridLines />
      <HorizontalGridLines />
      <XAxis/>
      <YAxis />
      <VerticalBarSeries
        data={data}
        onValueClick={({x}) => onChange(
          name,
          filter.has(x)
            ? filter.remove(x)
            : filter.set(x, true)
        )}
      />
    </FlexibleWidthXYPlot>
  );
}

const SelectHistogram = ({name, bins=[], filter=Map(), onChange, height}) => {
  const options = [...bins]
    .sort((a, b) =>
      b.value - a.value || a.key.localeCompare(b.key)
    )
    .filter(d => d.value > 0)
    .map(({key, value}) => ({label: key, value: key, count: value}));

  const [minBin, maxBin] = extent(options, d => d.count);

  const binScale = scaleLinear()
    .domain([0, maxBin])
    .range([0, 100]);

  return <div style={{height, paddingLeft: 10}}>
    <div style={{position: 'absolute'}}>
      <div style={{position: 'relative', top: 0, left: 0, width: 250}}>
        <Select
          multi
          optionRenderer={
            ({label, count}) =>
              <div>
                { maxBin > minBin &&
                  <div style={{backgroundColor: 'darkgray', minHeight: 3, width: `${binScale(count)}%`}}/>
                }
                {label}
              </div>
          }
          onChange={d =>
            d === ''
              ? onChange(name)
              : onChange(name, Map(d.split(',').map(key => [key, true])))
          }
          options={options}
          placeholder='Select some stuff'
          simpleValue
          value={filter.keySeq().join(',')}
        />
      </div>
    </div>
  </div>
}

const FilterHistogramComponent = ({size=0, onClose, ...props}) => {
  const {name, filter=Map(), bins, type, dimension, ticks} = props;

  const filterRange = type === 'ordinal'
    ? filter.keySeq().toArray()
    : [filter.get(RANGE_FILTER_MIN), filter.get(RANGE_FILTER_MAX)];

  const filterText = (
    type === 'time'
      ? filterRange.map(d => getMultiFormat(ticks[0])(new Date(d))) 
      : filterRange
  ).join(' - ');

  return <Card>
    <CardHeader
      title={name}
      action={<IconButton onClick={() => onClose(name)}><CloseIcon /></IconButton>}
    />
    { props.type === 'ordinal'
        ? bins.length > 10
            ? <SelectHistogram {...props} />
            : <OrdinalHistogram size={size} {...props} />
        : <LinearHistogram {...props} />
    }

  </Card>
}

const FilterHistogram = connect(
  (state, {name}) => ({
    ...getFilteredData(state).get(name),
    size: state.getIn(LOADED_DATA_FEATURES_PATH, []).length,
    filter: state.getIn([...FILTERS_PATH, name]),
    cmap: state.getIn(COLOR_PATH),
  }),
  dispatch => bindActionCreators({
    onChange: createSetFilterAction,
    onClose: createToggleFilterAction
  }, dispatch),
)(FilterHistogramComponent)

const FiltersSelectComponent = ({columns=[], filters=Map(), onChange}) =>
  <Select multi simpleValue
    placeholder='Select a feature'
    value={filters.keySeq().join(',')}
    options={columns.map(value => ({value, label: value}))}
    onChange={value =>
      value === ''
        ? onChange(Map())
        : onChange(
            Map(value.split(',').map(key =>
              [key, filters.get(key)]
            ))
          )
    }
  />

const FilterSelect = connect(
  state => getStateFromPath({
    filters: FILTERS_PATH,
    columns: LOADED_DATA_COLUMNS_PATH,
  }, state),
  dispatch => bindActionCreators({
    onChange: createReplaceFiltersAction
  }, dispatch)
)(FiltersSelectComponent)

const FiltersList = ({data=Map(), onChange}) => {
  const numActiveFilters = data.valueSeq().reduce((sum, x) => sum + (x !== undefined), 0);

  return <div style={{width: '100%'}}>
    <FilterSelect />
    { data.keySeq().map(k =>
        <FilterHistogram key={k} name={k} height={150}/>
      )
    }
  </div>
}

export default connect(
  state => getStateFromPath({
    data: FILTERS_PATH,
  }, state),
  dispatch => ({})
)(FiltersList)

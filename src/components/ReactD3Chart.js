'use strict';

import React from 'react';

import {select} from 'd3-selection';

const setupDefs = (selection, defs=[], state) => {
  const g = selection.selectAll('g.def')
    .data(defs, d => d.name);

  g.enter()
    .append('g')
      .attr('class', d => 'def ' + d.name)
      .merge(g)
        .each(function (d) {
          select(this).call(d.callback, state);
        });

  g.exit()
    .remove();
};

const setupLayers = (selection, layers=[], state) => {
  const g = selection.selectAll('g.layer')
    .data(layers, d => d.name);

  g.enter()
    .append('g')
      .attr('class', d => 'layer ' + d.name)
      .merge(g)
        .each(function (d) {
          select(this).call(d.callback, state);
        });

  g.exit()
    .remove();
};

const noInit = () => null;

let uids = 0;

class ChartComponent extends React.Component {
  constructor(props) {
    super(props);

    // auto-generate an identifier for this chart
    this.uid = uids++;
  }

  componentDidMount() {
    this.componentDidUpdate();
  }

  componentDidUpdate () {
    const {margin={}, init=noInit} = this.props;
    const {top=0, left=0, bottom=0, right=0} = margin;
    let {width, height} = this.svg.getBoundingClientRect();

    width = width - left - right;
    height = height - top - bottom;

    const props = {...this.props, uid: this.uid, width, height};
    const state = {...props, ...init(props)};

    if (width && height) {
      select(this.svg)
        .select('defs')
          .call(setupDefs, state.defs || [], state);
          
      select(this.svg)
        .select('g.chart')
          .attr('transform', 'translate(' + [left, height + top] + ')')
          .call(setupLayers, state.layers, state);
    }
  }

  render () {
    const {width, height, className, style} = this.props;
    return (
      <svg
        width={width}
        height={height}
        className={className}
        style={style}
        ref={svg => {this.svg = svg;}}
      >
        <defs />
        <g className='chart'/>
      </svg>
    );
  }
}

ChartComponent.displayName = 'ChartComponent';

// Uncomment properties you need
// ChartComponent.propTypes = {};
// ChartComponent.defaultProps = {};

export default ChartComponent;

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

import {range} from 'd3-array'
import {format} from 'd3-format'

import Avatar from 'material-ui/Avatar'

import Checkbox from 'material-ui/Checkbox'

import Table, {
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
} from 'material-ui/Table';
import Tooltip from 'material-ui/Tooltip';
import ExpansionPanel, {ExpansionPanelSummary, ExpansionPanelDetails} from 'material-ui/ExpansionPanel'
import Typography from 'material-ui/Typography'

import ExpandMoreIcon from 'material-ui-icons/ExpandMore'

import {getStateFromPath, setStateFromPath} from '../actions'

import {
  LOADED_DATA_FEATURES_PATH,
  LOADED_DATA_COLUMNS_PATH
} from '../actions/data'

import {
  PAGE_PATH,
  ROWS_PER_PAGE_PATH,
} from '../actions/table'

import {COLOR_PATH, defaultColor} from '../actions/legend'

import Icon from './Icons'

import {
  getFilterDomains,
  getFilteredData,
  SORT_BY_PATH,
  SORT_ASCENDING_PATH,
  createSetSortByAction,
  createSetSortAscendingAction
} from '../actions/crossfilter'

const numberFormat = format(",.2r");

const DataTableAvatarComponent = ({name, color}) =>
  <Avatar
    style={{backgroundColor: color}}
  >
    {String(name).slice(0, 3)}
  </Avatar>

export const DataTableAvatar = connect(
  (state, {name}) => ({
    color: state.getIn(COLOR_PATH, Map())
      .get(name, defaultColor(name))
  })
)(DataTableAvatarComponent);

const DataTableHeader = ({dimensions, sortBy, sortAscending=false, onChangeSortBy, onChangeSortOrder, ...props}) => {
  sortBy = dimensions.has(sortBy)
    ? sortBy
    : dimensions.keySeq().first();

  return <TableHead>
    <TableRow>
      <TableCell />

      { dimensions.entrySeq().map(([k, {type}]) =>
          <TableCell key={k} numeric={type !== 'ordinal'}>
            <Tooltip
              title='Sort'
              placement={type !== 'ordinal' ? 'bottom-end' : 'bottom-start'}
              enterDelay={300}
            >
              <TableSortLabel
                active={sortBy === k}
                direction={sortAscending ? 'asc' : 'desc'}
                onClick={() => 
                  k === sortBy
                    ? onChangeSortOrder(!sortAscending)
                    : onChangeSortBy(k)
                }
              >
                {k}
              </TableSortLabel>
            </Tooltip>
          </TableCell>
        )
      }      
    </TableRow>
  </TableHead>
}

const DataTableBody = ({
  domains=Map(),
  dimensions=Map(),
  data,
  columns,
  cmap=Map(),
  descr,
  page,
  rowsPerPage,
  onSelect,
  sortBy,
  sortAscending,
  selection=Map(),
  ...props
}) => {
  if (dimensions.size === 0 || data.length === 0) {
    return <TableBody>
      <TableRow>
        <TableCell />
      </TableRow>
    </TableBody>
  }

  const {dimension} = dimensions.get(sortBy, dimensions.first());

  const iis = (
    sortAscending
      ? dimension.bottom
      : dimension.top
  )(rowsPerPage, page*rowsPerPage);

  const columnsInverse = dimensions.map((v, k) => columns.indexOf(k));

  return (
    <TableBody>
      { iis.map(i =>
          <TableRow key={i}>
            <TableCell>
              <Icon index={i} />
            </TableCell>

            { columnsInverse
                .map((j, k) =>
                  domains.get(k).type === 'ordinal'
                    ? <TableCell key={k}>
                        <DataTableAvatar name={data[i][j]} />
                      </TableCell>
                    : <TableCell key={k} numeric={typeof(data[i][j]) === 'number'} padding='dense'>
                        <Typography variant='title'>{numberFormat(data[i][j])}</Typography>
                      </TableCell>
                ).toArray()
            }
          </TableRow>
        )
      }
    </TableBody>
  );
}

const DataTableFooter = ({dimensions=Map(), page, rowsPerPage, onChangePage, onChangeRowsPerPage, ...props}) => {
  const count = dimensions.size
    ? dimensions.first().dimension.top(Infinity).length
    : 0

  return <TableFooter>
    <TableRow>
      <TablePagination
        count={count}
        page={page}
        rowsPerPage={rowsPerPage}
        onChangePage={onChangePage}
        onChangeRowsPerPage={onChangeRowsPerPage}
      />
    </TableRow>
  </TableFooter>
}

class DataTable extends Component {
  render() {

    const {onChangePage, onChangeRowsPerPage, ...props} = this.props;

    if (!this.props.data) {
      return <div/>
    }

    return (
      <ExpansionPanel defaultExpanded>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>
            Table
          </Typography> 
        </ExpansionPanelSummary>

        <ExpansionPanelDetails>
          <Table>
            <DataTableHeader {...this.props}/>
            <DataTableBody {...this.props}/>
            <DataTableFooter
              {...props}
              onChangePage={(ev, page) =>
                onChangePage && onChangePage(page)
              }
              onChangeRowsPerPage={ev =>
                onChangeRowsPerPage && onChangeRowsPerPage(ev.target.value)
              }
            />
          </Table>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }
}

DataTable.defaultProps = {
  page: 0,
  rowsPerPage: 5,
  order: 1,
};

export default connect(
  state => ({
    ...getStateFromPath({
      data: LOADED_DATA_FEATURES_PATH,
      columns: LOADED_DATA_COLUMNS_PATH,

      sortBy: SORT_BY_PATH,
      sortAscending: SORT_ASCENDING_PATH,

      page: PAGE_PATH,
      rowsPerPage: ROWS_PER_PAGE_PATH,
    }, state),
    domains: getFilterDomains(state),
    dimensions: getFilteredData(state)
  }),
  dispatch => ({
    ...setStateFromPath({
      onChangePage: PAGE_PATH,
      onChangeRowsPerPage: ROWS_PER_PAGE_PATH,
    }, dispatch),

    ...bindActionCreators({
      onChangeSortBy: createSetSortByAction,
      onChangeSortOrder: createSetSortAscendingAction,
    }, dispatch)
  })
)(DataTable)

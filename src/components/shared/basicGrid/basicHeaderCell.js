// Copyright (c) Microsoft. All rights reserved.

import React from 'react';
import PropTypes from 'prop-types';

import { joinClasses } from 'utilities';

import './styles/basicGrid.css';

export const BasicHeaderCell = (props) => (
  <div className={joinClasses('basic-cell basic-cell-header', props.className)}>{props.children}</div>
);

BasicHeaderCell.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

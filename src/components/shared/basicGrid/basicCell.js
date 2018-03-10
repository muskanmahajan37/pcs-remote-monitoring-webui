// Copyright (c) Microsoft. All rights reserved.

import React from 'react';
import PropTypes from 'prop-types';

import { joinClasses } from 'utilities';

import './styles/basicGrid.css';

export const BasicCell = (props) => (
  <div className={joinClasses('basic-cell', props.className)}>{props.children}</div>
);

BasicCell.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

// Copyright (c) Microsoft. All rights reserved.

import React from 'react';
import PropTypes from 'prop-types';

import { joinClasses } from 'utilities';

import './styles/basicGrid.css';

export const BasicRow = (props) => (
  <div className={joinClasses('basic-row', props.className)}>{props.children}</div>
);

BasicRow.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

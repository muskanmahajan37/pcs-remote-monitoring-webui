// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import PropTypes from 'prop-types';

export class SimpleNameValueDisplay extends Component {
  render() {
    const { t, pairs } = this.props;
    if (pairs) {
      var pairList = Object.entries(pairs).map(([key, value]) => {
        return (
          <tr key={key}>
            <td>{key} </td>
            <td>{value.toString()}</td>
          </tr>
        );
      });
      return (
        <table>
          <thead>
            <tr>
              <th>{t('devices.details.name')}</th>
              <th>{t('devices.details.value')}</th>
            </tr>
          </thead>
          <tbody>{pairList}</tbody>
        </table>
      );
    }
    return null;
  };
};

SimpleNameValueDisplay.propTypes = {
  pairs: PropTypes.object,
  t: PropTypes.func
};

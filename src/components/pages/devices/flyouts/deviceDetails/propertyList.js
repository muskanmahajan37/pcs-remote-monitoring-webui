// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import PropTypes from 'prop-types';

export class PropertyList extends Component {
  render() {
    const { t, pairs } = this.props;
    if (pairs) {
      var pairList = Object.entries(pairs).map(([key, value]) => {
        return (
          <div key={key} className="property-row">
            <div className="property-name">{key}</div>

            {/* TODO: Remove the "toString() call. Leaving it for now because it blows up on the telemetry property being an object. */}
            <div className="property-value">{value.toString()}</div>
          </div>
        );
      });
      return (
        <div>
          <div className="property-row">
            <div className="property-name property-header">{t('devices.details.name')}</div>
            <div className="property-value property-header">{t('devices.details.value')}</div>
          </div>
          {pairList}
        </div>
      );
    }
    return null;
  };
};

PropertyList.propTypes = {
  pairs: PropTypes.object,
  t: PropTypes.func
};

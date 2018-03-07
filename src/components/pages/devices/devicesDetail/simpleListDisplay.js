// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import PropTypes from 'prop-types';

export class SimpleListDisplay extends Component {
  render() {
    const { list } = this.props;
    if (list) {
      var itemList = list.map((item, idx) => {
        return (
          <div key={idx} className="list-item">
            {item.toString()}
          </div>
        );
      });
      return (
        <div className="simple-list">
          {itemList}
        </div>
      );
    }
    return null;
  };
};

SimpleListDisplay.propTypes = {
  list: PropTypes.array
};

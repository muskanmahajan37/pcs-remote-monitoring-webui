// Copyright (c) Microsoft. All rights reserved.

import React from 'react';
import PropTypes from 'prop-types';


export const MethodList = ({ list }) => (
  <div className="simple-list">
    {
      !!list && list.map((item, idx) =>
        <div key={idx} className="list-item">
          {item}
        </div>
      )
    }
  </div>
);

MethodList.propTypes = {
  list: PropTypes.array
};

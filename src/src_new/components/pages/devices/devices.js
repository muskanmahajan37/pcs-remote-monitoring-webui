// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import { Grid } from 'components/shared';

import './devices.css';

export class Devices extends Component {
  render () {
    const gridProps = {
      columnDefs: [
        { headerName: "Test", field: 'make' }
      ],
      rowData: [
        { make: "Toyota",  model: "Celica", price: 35000 },
        { make: "Ford",    model: "Mondeo", price: 32000 },
        { make: "Porsche", model: "Boxter", price: 72000 }
      ]
    };
    return (
      <div className="devices-container">
        <div>Devices Page</div>
        <Grid {...gridProps} />
      </div>
    );
  }
}

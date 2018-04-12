// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import { Btn, PcsGrid } from 'components/shared';
import { profilesColumnDefs, checkboxParams, defaultProfilesGridProps } from './profilesGridConfig';
import { isFunc, translateColumnDefs } from 'utilities';

export class ProfilesGrid extends Component {
  constructor(props) {
    super(props);

    this.columnDefs = [
      { ...profilesColumnDefs.displayName, ...checkboxParams }
    ];

    // TODO: This is a temporary example implementation. Remove with a better version
    this.contextBtns = {
      disable: <Btn key="disable">Disable</Btn>,
      edit: <Btn key="edit">Edit</Btn>
    };
  }

  onGridReady = gridReadyEvent => {
    this.deviceGridApi = gridReadyEvent.api;
    gridReadyEvent.api.sizeColumnsToFit();
    // Call the onReady props if it exists
    if (isFunc(this.props.onGridReady)) {
      this.props.onGridReady(gridReadyEvent);
    }
  };

  /**
   * Handles context filter changes and calls any hard select props method
   *
   * @param {Array} selectedDevices A list of currently selected devices
   */
  onHardSelectChange = (selectedDevices) => {
    const { onContextMenuChange, onHardSelectChange} = this.props;
    if (isFunc(onContextMenuChange)) {
      if (selectedDevices.length > 1) {
        onContextMenuChange(this.contextBtns.disable);
      } else if (selectedDevices.length === 1) {
        onContextMenuChange([
          this.contextBtns.disable,
          this.contextBtns.edit
        ]);
      } else {
        onContextMenuChange(null);
      }
    }
    if (isFunc(onHardSelectChange)) {
      onHardSelectChange(selectedDevices);
    }
  }

  render () {
    const gridProps = {
      /* Grid Properties */
      ...defaultProfilesGridProps,
      columnDefs: translateColumnDefs(this.props.t, this.columnDefs),
      ...this.props, // Allow default property overrides
      context: {
        t: this.props.t
      },
      /* Grid Events */
      onHardSelectChange: this.onHardSelectChange,
      onGridReady: this.onGridReady
    };

    return  (
      <PcsGrid {...gridProps} />
    );
  }
}

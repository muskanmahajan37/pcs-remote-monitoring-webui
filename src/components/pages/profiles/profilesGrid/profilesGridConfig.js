// Copyright (c) Microsoft. All rights reserved.

import React from "react";

import {
  ProfileStatusRenderer,
  CountRenderer,
  LastTriggerRenderer,
  LinkRenderer
} from 'components/shared/cellRenderers';
export const LAST_TRIGGER_DEFAULT_WIDTH = 310;

export const checkboxParams = {
  headerCheckboxSelection: true,
  headerCheckboxSelectionFilteredOnly: true,
  checkboxSelection: true
};

export const profilesColumnDefs = {
  displayName: {
    headerName: 'profiles.grid.displayName',
    field: 'displayName',
    filter: 'text'
  }
};

export const defaultProfilesGridProps = {
  enableColResize: true,
  multiSelect: true,
  paginationPageSize: 20,
  rowSelection: 'multiple',
  suppressCellSelection: true,
  suppressClickEdit: true,
  suppressRowClickSelection: true
};

// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import {
  Flyout,
  FlyoutHeader,
  FlyoutTitle,
  FlyoutCloseBtn,
  FlyoutContent,
  FlyoutSection,
  SectionHeader,
  SectionDesc,
  BasicGrid as Grid,
  BasicRow as Row,
  BasicHeaderCell as HeaderCell,
  BasicCell as Cell
} from 'components/shared';
import { DeviceIcon } from './deviceDetails/deviceIcon';

import './deviceDetails/deviceDetails.css';

export class DeviceDetails extends Component {
  render() {
    const { t, onClose, device } = this.props;
    return (
      <Flyout>
        <FlyoutHeader>
          <FlyoutTitle>{t('devices.details.title')}</FlyoutTitle>
          <FlyoutCloseBtn onClick={onClose} />
        </FlyoutHeader>
        <FlyoutContent>
          {
            !device &&
            <div className="device-details-container">{t("devices.details.noDevice")}</div>
          }
          {
            !!device &&
            <div className="device-details-container">

              <Grid className="device-details-header">
                <Row>
                  <Cell className="col-3"><DeviceIcon type={device.type} /></Cell>
                  <Cell className="col-7">
                      <div class="device-name">{device.id}</div>
                      <div class="device-simulated">{device.isSimulated ? t('devices.details.simulated') : t('devices.details.notSimulated')}</div>
                      <div class="device-connected">{device.connected ? t('devices.details.connected') : t('devices.details.notConnected')}</div>
                  </Cell>
                </Row>
              </Grid>

              TODO: Add Rules Grid.

              <FlyoutSection>
                <SectionHeader>{t('devices.details.telemetry.title')}</SectionHeader>
                TODO: Add chart when able..
              </FlyoutSection>

              <FlyoutSection>
                <SectionHeader>{t('devices.details.tags.title')}</SectionHeader>
                <SectionDesc>{t('devices.details.tags.description')}</SectionDesc>
                <Grid className="section-content">
                  <Row>
                    <HeaderCell className="col-3">{t('devices.details.tags.keyHeader')}</HeaderCell>
                    <HeaderCell className="col-7">{t('devices.details.tags.valueHeader')}</HeaderCell>
                  </Row>
                  {
                    (Object.entries(device.tags) || []).map((item, idx) =>
                      <Row key={idx}>
                        <Cell className="col-3">{item[0]}</Cell>
                        <Cell className="col-7">{item[1].toString()}</Cell>
                      </Row>
                    )
                  }
                </Grid>
              </FlyoutSection>

              <FlyoutSection>
                <SectionHeader>{t('devices.details.methods.title')}</SectionHeader>
                <SectionDesc>{t('devices.details.methods.description')}</SectionDesc>
                <Grid className="section-content">
                  {
                    ((device.methods || '').split(',') || []).map((item, idx) =>
                      <Row key={idx}>
                        <Cell>{item}</Cell>
                      </Row>
                    )
                  }
                </Grid>
              </FlyoutSection>

              <FlyoutSection>
                <SectionHeader>{t('devices.details.properties.title')}</SectionHeader>
                <SectionDesc>{t('devices.details.properties.description')}</SectionDesc>
                <Grid className="section-content">
                  <Row>
                    <HeaderCell className="col-3">{t('devices.details.properties.keyHeader')}</HeaderCell>
                    <HeaderCell className="col-7">{t('devices.details.properties.valueHeader')}</HeaderCell>
                  </Row>
                  {
                    (Object.entries(device.properties) || []).map((item, idx) =>
                      <Row key={idx}>
                        <Cell className="col-3">{item[0]}</Cell>
                        <Cell className="col-7">{item[1].toString()}</Cell>
                      </Row>
                    )
                  }
                </Grid>
              </FlyoutSection>

              <FlyoutSection>
                <SectionHeader>{t('devices.details.diagnostics.title')}</SectionHeader>
                <SectionDesc>{t('devices.details.diagnostics.description')}</SectionDesc>
                TODO: Add diagnostics.
              </FlyoutSection>
            </div>
          }
        </FlyoutContent>
      </Flyout>
    );
  }
}

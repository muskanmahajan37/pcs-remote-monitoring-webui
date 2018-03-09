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
  SectionDesc
} from 'components/shared';
import { MethodList } from './deviceDetails/methodList';
import { PropertyList } from './deviceDetails/propertyList';

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

              TODO: Add Rules Grid.

              <FlyoutSection>
                <SectionHeader>{t('devices.details.telemetry.title')}</SectionHeader>
                TODO: Add chart when able..
              </FlyoutSection>

              <FlyoutSection>
                <SectionHeader>{t('devices.details.tags.title')}</SectionHeader>
                <SectionDesc>{t('devices.details.tags.description')}</SectionDesc>
                <PropertyList className="section-content" t={t} pairs={device.tags} />
              </FlyoutSection>

              <FlyoutSection>
                <SectionHeader>{t('devices.details.methods.title')}</SectionHeader>
                <SectionDesc>{t('devices.details.methods.description')}</SectionDesc>
                <MethodList className="section-content" list={(device.methods || '').split(',')} />
              </FlyoutSection>

              <FlyoutSection>
                <SectionHeader>{t('devices.details.properties.title')}</SectionHeader>
                <SectionDesc>{t('devices.details.properties.description')}</SectionDesc>
                <PropertyList className="section-content" t={t} pairs={device.properties} />
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

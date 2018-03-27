// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';

import { IoTHubManagerService } from 'services';
import {
  copyToClipboard,
  LinkedComponent,
  svgs
} from 'utilities';
import { Svg } from 'components/shared/svg/svg';
import {
  Btn,
  BtnToolbar,
  ErrorMsg,
  Flyout,
  FlyoutHeader,
  FlyoutTitle,
  FlyoutCloseBtn,
  FlyoutContent,
  FormSection,
  Indicator,
  SectionDesc,
  SectionHeader,
  SummaryCount,
  SummarySection
} from 'components/shared';

import './deviceNew.css';

const DeviceDetail = ({ label, value }) => (
  <FormSection className="device-detail">
    <SectionHeader>{label}</SectionHeader>
    <div className="device-detail-contents">
      <div className="device-detail-value">{value}</div>
      <Svg className="copy-icon" path={svgs.copy} onClick={() => copyToClipboard(value)} />
    </div>
  </FormSection>
);

const DeviceConnectionString = ({ label, deviceId, hostName, accessKey }) => (
  <DeviceDetail label={label} value={`HostName=${hostName};DeviceId=${deviceId};SharedAccessKey=${accessKey}`} />
);


const ProvisionedDevice = ({ device, t }) => {
  const { id: id, ioTHubHostName: hostName, authentication: { primaryKey: primaryKey }, authentication: { secondaryKey: secondaryKey } } = device;

  return (
    <div>
      <pre>{JSON.stringify(device, null, 2)}</pre>

      <DeviceDetail label={t('device.new.deviceId')} value={id} />
      <DeviceDetail label={t('device.new.primaryKey')} value={primaryKey} />
      <DeviceDetail label={t('device.new.secondaryKey')} value={secondaryKey} />
      <DeviceConnectionString label={t('device.new.primaryKeyConnection')} deviceId={id} hostName={hostName} accessKey={primaryKey} />
      <DeviceConnectionString label={t('device.new.secondaryKeyConnection')} deviceId={id} hostName={hostName} accessKey={secondaryKey} />
    </div>
  );
};

export class DeviceNew extends LinkedComponent {
  constructor(props) {
    super(props);
    this.state = {
      isPending: false,
      error: undefined,
      successCount: 0,
      changesApplied: false,
      formData: {
        count: 1
      },
      provisionedDevice: {}
    };

    this.countLink = this.linkTo('count');
  }

  componentWillUnmount() {
    if (this.subscription) this.subscription.unsubscribe();
  }

  provisionDevices = () => {
    this.setState({ isPending: true });

    console.log(this.state);
    console.log(this.countLink);

    this.subscription = IoTHubManagerService.provisionDevice({ "Id": "", "Authentication": {}, "IsSimulated": false })
      .subscribe(
        provisionedDevice => {
          this.setState({ provisionedDevice, successCount: this.state.formData.count, isPending: false, changesApplied: true });
          return this.props.insertDevice(provisionedDevice);
        },
        error => this.setState({ error, isPending: false, changesApplied: true })
      );
  }

  render() {
    const { t, onClose } = this.props;
    const { formData, provisionedDevice, isPending, error, successCount, changesApplied } = this.state;

    const summaryCount = changesApplied ? successCount : formData.count;
    const summaryMessage = isPending ? t('devices.new.pending') : changesApplied ? t('devices.new.applySuccess') : t('devices.new.affected');
    const completedSuccessfully = changesApplied && successCount === formData.count;



    return (
      <Flyout>
        <FlyoutHeader>
          <FlyoutTitle>{t('devices.new.title')}</FlyoutTitle>
          <FlyoutCloseBtn onClick={onClose} />
        </FlyoutHeader>
        <FlyoutContent>
          <div className="devices-new-container">
            <div className="devices-new-header">{t('devices.new.header')}</div>
            <div className="devices-new-descr">{t('devices.new.description')}</div>

            <form>

            </form>


            <SummarySection title={t('devices.new.summaryHeader')}>
              <SummaryCount>{summaryCount}</SummaryCount>
              <SectionDesc>{summaryMessage}</SectionDesc>
              {this.state.isPending && <Indicator />}
              {completedSuccessfully && <Svg className="summary-icon" path={svgs.apply} />}
            </SummarySection>

            {
              error &&
              <div className="devices-new-error">
                <ErrorMsg>{error}</ErrorMsg>
              </div>
            }
            {
              !changesApplied &&
              <BtnToolbar className="tools-preApply">
                <Btn svg={svgs.trash} primary={true} disabled={isPending || formData.count === 0} onClick={this.provisionDevices}>{t('devices.new.apply')}</Btn>
                <Btn svg={svgs.cancelX} onClick={onClose}>{t('devices.new.cancel')}</Btn>
              </BtnToolbar>
            }
            {
              !!changesApplied &&
              <div>
                <ProvisionedDevice device={provisionedDevice} t={t} />

                <BtnToolbar className="tools-postApply">
                  <Btn svg={svgs.cancelX} onClick={onClose}>{t('devices.new.close')}</Btn>
                </BtnToolbar>
              </div>
            }
          </div>
        </FlyoutContent>
      </Flyout>
    );
  }
}

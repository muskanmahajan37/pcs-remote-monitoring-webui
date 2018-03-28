// Copyright (c) Microsoft. All rights reserved.

import React from 'react';
import update from 'immutability-helper';

import { IoTHubManagerService } from 'services';
import {
  copyToClipboard,
  LinkedComponent,
  svgs,
  Validator
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
  FormControl,
  FormGroup,
  FormLabel,
  FormSection,
  Indicator,
  Radio,
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

const DeviceConnectionString = ({ label, deviceId, hostName, sharedAccessKey }) => (
  <DeviceDetail label={label} value={`HostName=${hostName};DeviceId=${deviceId};SharedAccessKey=${sharedAccessKey}`} />
);

const ProvisionedDevice = ({ device, t }) => {
  const {
    id,
    ioTHubHostName: hostName,
    authentication: { primaryKey },
    authentication: { secondaryKey }
  } = device;

  return (
    <div>
      <DeviceDetail label={t('devices.new.deviceId.label')} value={id} />
      <DeviceDetail label={t('devices.new.authenticationKey.primaryKey')} value={primaryKey} />
      <DeviceDetail label={t('devices.new.authenticationKey.secondaryKey')} value={secondaryKey} />
      <DeviceConnectionString label={t('devices.new.authenticationKey.primaryKeyConnection')} deviceId={id} hostName={hostName} sharedAccessKey={primaryKey} />
      <DeviceConnectionString label={t('devices.new.authenticationKey.secondaryKeyConnection')} deviceId={id} hostName={hostName} sharedAccessKey={secondaryKey} />
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
        count: 1,
        deviceId: '',
        deviceType: 'physical',
        deviceModel: undefined,
        authenticationType: '0',
        authenticationKey: '0',
        primaryKey: undefined,
        secondaryKey: undefined
      },
      request: {
        //Using Pascal Case names here because that is what the request to the server needs
        Id: '',
        IsSimulated: false,
        Authentication: {}
        //{AuthenticationType: 0, PrimaryKey: "dfad", SecondaryKey: "dafsd"}
        //{AuthenticationType: 1, PrimaryThumbprint: "fdsaf", SecondaryThumbprint: "dafsd"}
      },
      provisionedDevice: {}
    };

    // this bindings
    this.formIsValid = this.formIsValid.bind(this);

    // Linked components
    // TODO: Translate validation messages... hopefully, in a way that doesn't require every form to duplicate the same messages.
    this.formDataLink = this.linkTo('formData');

    this.countLink = this.formDataLink.forkTo('count')
      .check(Validator.notEmpty, 'Number of devices is required.')
      .check(num => num > 0, 'Number of devices must be greater than zero.');

    this.deviceIdLink = this.formDataLink.forkTo('deviceId');

    this.deviceTypeLink = this.formDataLink.forkTo('deviceType')
      .check(Validator.notEmpty, 'Device type is required.');

    this.deviceModelLink = this.formDataLink.forkTo('deviceModel');

    this.authenticationTypeLink = this.formDataLink.forkTo('authenticationType');
    this.authenticationKeyLink = this.formDataLink.forkTo('authenticationKey');
    this.primaryKeyLink = this.formDataLink.forkTo('primaryKey');
    this.secondaryKeyLink = this.formDataLink.forkTo('secondaryKey');
  }

  componentWillUnmount() {
    if (this.subscription) this.subscription.unsubscribe();
  }

  shouldComponentUpdate(nextProps, nextState) {
    // When the device type is Physical, only allow 1 to be created
    if (nextState.formData.deviceType === 'physical' && nextState.formData.count !== 1) {
      this.setState(update(nextState, {
        formData: { count: { $set: 1 } }
      }));
    }

    // When the authentication type is X.509, change to enter keys manually
    if (nextState.formData.authenticationType === '1' && nextState.formData.authenticationKey !== '1') {
      this.setState(update(nextState, {
        formData: { authenticationKey: { $set: '1' } }
      }));
    }

    // Update normally
    return true;
  }

  formIsValid() {
    return [
      this.countLink,
      this.deviceIdLink,
      this.deviceTypeLink
    ].every(link => !link.error);
  }

  apply = () => {
    //TODO: Implement this based on the new structure of state... which will also involve figuring out if I really need form state separate from the request state.

    /*
    this.setState({ isPending: true });

    console.log(this.state);
    console.log(this.countLink);

    this.subscription = IoTHubManagerService.provisionDevice(this.state.formData)
      .subscribe(
        provisionedDevice => {
          this.setState({ provisionedDevice, successCount: this.state.formData.count, isPending: false, changesApplied: true });
          this.props.insertDevice(provisionedDevice);
        },
        error => this.setState({ error, isPending: false, changesApplied: true })
      );
    */
  }

  render() {
    const { t, onClose } = this.props;
    const { formData, provisionedDevice, isPending, error, successCount, changesApplied } = this.state;

    const deviceName = this.deviceModelLink.value || t('devices.new.deviceIdExample.deviceName');
    const isX509 = this.authenticationTypeLink.value === '1';
    const summaryCount = changesApplied ? successCount : formData.count;
    let summaryMessage = t('devices.new.affected');
    if (isPending) {
      summaryMessage = t('devices.new.pending');
    }
    else if (changesApplied) {
      summaryMessage = t('devices.new.applySuccess');
    }
    const completedSuccessfully = changesApplied && successCount === formData.count;

    return (
      <Flyout>
        <FlyoutHeader>
          <FlyoutTitle>{t('devices.new.title')}</FlyoutTitle>
          <FlyoutCloseBtn onClick={onClose} />
        </FlyoutHeader>
        <FlyoutContent>
          <div className="devices-new-container">
            <form onSubmit={this.apply}>

              <FormGroup>
                <FormLabel>{t('devices.new.deviceType.label')}</FormLabel>
                <Radio link={this.deviceTypeLink} value="simulated">
                  {t('devices.new.deviceType.simulated')}
                </Radio>
                <Radio link={this.deviceTypeLink} value="physical">
                  {t('devices.new.deviceType.physical')}
                </Radio>
              </FormGroup>

              {
                this.deviceTypeLink.value === "simulated" && [
                  <FormGroup>
                    <FormLabel>{t('devices.new.count.label')}</FormLabel>
                    <FormControl link={this.countLink} type="number" />

                  </FormGroup>,
                  <FormGroup>
                    <FormLabel>{t('devices.new.deviceIdExample.label')}</FormLabel>
                    <div className="device-id-example">{t('devices.new.deviceIdExample.format', { deviceName })}</div>
                  </FormGroup>,
                  <FormGroup>
                    <FormLabel>{t('devices.new.deviceModel.label')}</FormLabel>
                    <div className="device-model-temp">{t('devices.new.deviceModel.hint')} -- TODO: Add options</div>
                  </FormGroup>
                ]
              }
              {
                this.deviceTypeLink.value === "physical" && [
                  <FormGroup>
                    <FormLabel>{t('devices.new.count.label')}</FormLabel>
                    <div className="device-count">{this.countLink.value}</div>
                  </FormGroup>,
                  <FormGroup>
                    <FormLabel>{t('devices.new.authenticationType.label')}</FormLabel>
                    <Radio link={this.authenticationTypeLink} value="0">
                      {t('devices.new.authenticationType.0')}
                    </Radio>
                    <Radio link={this.authenticationTypeLink} value="1">
                      {t('devices.new.authenticationType.1')}
                    </Radio>
                  </FormGroup>,
                  <FormGroup>
                    <FormLabel>{t('devices.new.authenticationKey.label')}</FormLabel>
                    <Radio link={this.authenticationKeyLink} value="0" disabled={isX509}>
                      {t('devices.new.authenticationKey.0')}
                    </Radio>
                    <Radio link={this.authenticationKeyLink} value="1">
                      {t('devices.new.authenticationKey.1')}
                    </Radio>
                  </FormGroup>,
                  <FormGroup className="sub-settings">
                    <FormLabel>{isX509 ? t('devices.new.authenticationKey.primaryThumbprint') : t('devices.new.authenticationKey.primaryKey')}</FormLabel>
                    <FormControl link={this.primaryKeyLink} disabled={this.authenticationKeyLink.value === "0"} type="text" placeholder={t('devices.new.authenticationKey.hint')} />
                  </FormGroup>,
                  <FormGroup className="sub-settings">
                    <FormLabel>{t(isX509 ? t('devices.new.authenticationKey.secondaryThumbprint') : 'devices.new.authenticationKey.secondaryKey')}</FormLabel>
                    <FormControl link={this.secondaryKeyLink} disabled={this.authenticationKeyLink.value === "0"} type="text" placeholder={t('devices.new.authenticationKey.hint')} />
                  </FormGroup>
                ]
              }

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
                <Btn svg={svgs.trash} primary={true} disabled={isPending || formData.count === 0} onClick={this.apply}>{t('devices.new.apply')}</Btn>
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
